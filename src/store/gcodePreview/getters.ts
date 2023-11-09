import type { GetterTree } from 'vuex'
import type { BBox, GcodePreviewState, ViewerOptions, Layer, LayerNr, LayerPaths, Move, Part, Point3D } from './types'
import type { RootState } from '../types'
import type { AppFile } from '@/store/files/types'
import { binarySearch, moveToSVGPath } from '@/util/gcode-preview'
import isKeyOf from '@/util/is-key-of'

export const getters: GetterTree<GcodePreviewState, RootState> = {
  /**
   * Returns a collection of all the moves
   */
  getMoves: (state): Move[] => {
    return state.moves
  },

  getFile: (state): AppFile | undefined => {
    return state.file
  },

  getViewerOption: (state) => (key: keyof ViewerOptions): boolean => {
    return state.viewer[key]
  },

  getParserProgress: (state): number => {
    return state.parserProgress
  },

  getLayers: (state, getters, rootState): Layer[] => {
    if (state.layers.length) {
      return state.layers
    }

    const output = []
    const moves = getters.getMoves as Move[]

    let z = NaN
    let zStart = 0
    let zLast = NaN
    let zNext = NaN

    const { minLayerHeight } = rootState.config.uiSettings.gcodePreview

    moves.forEach((move, index) => {
      if (move.z !== undefined && z !== move.z) {
        z = move.z
        zStart = index
      }

      if (move.e && move.e > 0 && (Number.isNaN(zLast) || z < zLast || z >= zNext)) {
        if (['x', 'y', 'i', 'j'].some(x => isKeyOf(x, move) && move[x] !== 0)) {
          zLast = z
          zNext = Math.round((z + minLayerHeight) * 10000) / 10000

          output.push({
            z,
            move: zStart,
            filePosition: move.filePosition
          })
        }
      }
    })

    // If moves exist but there are no layers, add a single "default" layer at z=0
    // This can happen for gcode that only contains travel moves (eg: 2d plotters without Z or E steppers)
    if (output.length === 0 && moves.length) {
      output.push({
        z: 0,
        move: 0,
        filePosition: moves[0].filePosition
      })
    }

    return output
  },

  getParts: (state): Part[] => {
    return state.parts
  },

  getBounds: (state, getters): BBox => {
    let moves = getters.getMoves
    const layers = getters.getLayers as Layer[]

    // ignore first and last layer (priming and parking)
    const moveRangeStart = layers[layers.length > 1 ? 1 : 0]?.move
    const moveRangeEnd = layers[layers.length - 1]?.move
    if (moveRangeStart && moveRangeEnd) moves = moves.slice(moveRangeStart, moveRangeEnd)

    const bounds = {
      x: {
        min: NaN,
        max: NaN
      },
      y: {
        min: NaN,
        max: NaN
      }
    }

    const isFinite = Number.isFinite
    let index = 0

    for (; index < moves.length && !Object.values(bounds).every(isFinite); index++) {
      const move = moves[index]

      if (isFinite(move.x)) {
        bounds.x.min = isFinite(bounds.x.min) ? Math.min(bounds.x.min, move.x) : move.x
        bounds.x.max = isFinite(bounds.x.max) ? Math.max(bounds.x.max, move.x) : move.x
      }

      if (isFinite(move.y)) {
        bounds.y.min = isFinite(bounds.y.min) ? Math.min(bounds.y.min, move.y) : move.y
        bounds.y.max = isFinite(bounds.y.max) ? Math.max(bounds.y.max, move.y) : move.y
      }
    }

    for (; index < moves.length; index++) {
      const move = moves[index]

      if (isFinite(move.x)) {
        bounds.x.min = Math.min(bounds.x.min, move.x)
        bounds.x.max = Math.max(bounds.x.max, move.x)
      }

      if (isFinite(move.y)) {
        bounds.y.min = Math.min(bounds.y.min, move.y)
        bounds.y.max = Math.max(bounds.y.max, move.y)
      }
    }

    return {
      x: {
        min: isFinite(bounds.x.min) ? bounds.x.min : 0,
        max: isFinite(bounds.x.max) ? bounds.x.max : 0
      },
      y: {
        min: isFinite(bounds.y.min) ? bounds.y.min : 0,
        max: isFinite(bounds.y.max) ? bounds.y.max : 0
      }
    }
  },

  getToolHeadPosition: (state, getters) => (moveIndex: number): Point3D => {
    const isFinite = Number.isFinite
    const moves = getters.getMoves
    const output = {
      x: NaN,
      y: NaN,
      z: NaN
    }

    for (let i = moveIndex; i >= 0 && (!isFinite(output.x) || !isFinite(output.y) || !isFinite(output.z)); i--) {
      if (!isFinite(output.x) && moves[i].x !== undefined) {
        output.x = moves[i].x
      }

      if (!isFinite(output.y) && moves[i].y !== undefined) {
        output.y = moves[i].y
      }

      if (!isFinite(output.z) && moves[i].z !== undefined) {
        output.z = moves[i].z
      }
    }

    return {
      x: isFinite(output.x) ? output.x : 0,
      y: isFinite(output.y) ? output.y : 0,
      z: isFinite(output.z) ? output.z : 0
    }
  },

  getPaths: (state, getters) => (startMove: number, endMove: number): LayerPaths => {
    const toolhead = getters.getToolHeadPosition(startMove)
    const moves = getters.getMoves

    const path: LayerPaths = {
      extrusions: '',
      moves: `M${toolhead.x},${toolhead.y}`,
      retractions: [],
      extrusionStarts: [],
      toolhead: {
        x: 0,
        y: 0
      }
    }

    let traveling = true

    for (let index = startMove; index <= endMove && index < moves.length; index++) {
      const move = moves[index]

      if (move.e > 0) {
        if (traveling) {
          path.extrusions += `M${toolhead.x},${toolhead.y}`
          path.extrusionStarts.push({
            x: toolhead.x,
            y: toolhead.y
          })

          traveling = false
        }

        path.extrusions += moveToSVGPath(toolhead, move)
        Object.assign(toolhead, move)
      } else {
        if (!traveling) {
          path.moves += `M${toolhead.x},${toolhead.y}`
          traveling = true
        }

        if (move.e < 0) {
          path.retractions.push({
            x: toolhead.x,
            y: toolhead.y
          })
        }

        path.moves += moveToSVGPath(toolhead, move)
        Object.assign(toolhead, move)
      }
    }

    path.toolhead = {
      x: toolhead.x,
      y: toolhead.y
    }

    return path
  },

  getLayerPaths: (state, getters) => (layerNr: LayerNr): LayerPaths => {
    const layers = getters.getLayers as Layer[]

    return getters.getPaths(layers[layerNr]?.move ?? 0, (layers[layerNr + 1]?.move ?? Infinity) - 1)
  },

  getPartPaths: (state, getters): string[] => {
    const parts = getters.getParts as Part[]

    return parts
      .map(part => {
        const svgData: string[] = []

        part.polygon.forEach((point, index) => {
          svgData.push(`${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
        })

        svgData.push('z')

        return svgData.join()
      })
  },

  getMoveIndexByFilePosition: (state, getters) => (filePosition: number): number => {
    if (filePosition <= 0) {
      return 0
    }

    return binarySearch(getters.getMoves, (val: Move) => filePosition - val.filePosition, true)
  },

  getLayerNrByFilePosition: (state, getters) => (filePosition: number): LayerNr => {
    const layers = getters.getLayers as Layer[]

    for (let i = 0; i < layers.length - 1; i++) {
      if (filePosition < layers[i + 1].filePosition) {
        return i
      }
    }

    return layers.length - 1
  }
}
