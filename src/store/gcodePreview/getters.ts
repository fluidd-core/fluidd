import { GetterTree } from 'vuex'
import {
  BBox,
  GcodePreviewState,
  Layer,
  LayerNr,
  LayerPaths,
  Move,
  Point3D
} from './types'
import { RootState } from '../types'
import { AppFile } from '@/store/files/types'
import { binarySearch, moveToSVGPath } from '@/util/gcode-preview'
import { state as configState } from '@/store/config'

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

  getViewerOption: (state) => (key: string): any => {
    return (state.viewer as any)[key]
  },

  getParserProgress: (state): number => {
    return state.parserProgress
  },

  getLayers: (state, getters, rootState): Layer[] => {
    const output = []
    const moves = getters.getMoves

    let z = NaN
    let zStart = 0
    let zLast = NaN

    const { uiSettings } = (rootState && rootState.config) ? rootState.config : configState
    const groupLowerLayers = uiSettings.gcodePreview.groupLowerLayers

    const zCmp = groupLowerLayers
      ? (a: number, b: number) => Number.isNaN(a) || a < b
      : (a: number, b: number) => a !== b

    for (let index = 0; index < moves.length; index++) {
      if (moves[index].z !== undefined && z !== moves[index].z) {
        z = moves[index].z
        zStart = index
      }

      if (moves[index].e > 0 && zCmp(zLast, z)) {
        zLast = z

        output.push({
          z,
          move: zStart,
          filePosition: moves[index].filePosition
        })
      }
    }

    return output
  },

  getBounds: (state, getters): BBox => {
    let moves = getters.getMoves
    const layers = getters.getLayers

    // ignore first and last layer (priming and parking)
    const moveRangeStart = layers[1]?.move
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
    const layers = getters.getLayers

    return getters.getPaths(layers[layerNr]?.move ?? 0, (layers[layerNr + 1]?.move ?? Infinity) - 1)
  },

  getMoveIndexByFilePosition: (state, getters) => (filePosition: number): number => {
    if (filePosition <= 0) {
      return 0
    }

    return binarySearch(getters.getMoves, (val: Move) => filePosition - (val.filePosition ?? 0), true)
  },

  getLayerNrByFilePosition: (state, getters) => (filePosition: number): LayerNr => {
    const layers = getters.getLayers

    for (let i = 0; i < layers.length - 1; i++) {
      if (filePosition < layers[i + 1].filePosition) {
        return i
      }
    }

    return layers.length - 1
  }
}
