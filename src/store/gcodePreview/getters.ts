import { GetterTree } from 'vuex'
import {
  GcodePreviewState,
  Layer,
  LayerNr,
  LayerPaths,
  Move,
  Point3D
} from './types'
import { RootState } from '../types'
import { AppFile } from '@/store/files/types'
import { binarySearch, moveToSVGPath } from '@/store/helpers'

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

  getLayers: (state, getters): Layer[] => {
    const output = []
    const moves = getters.getMoves

    let z = NaN
    let zStart = 0
    let zLast = NaN

    for (let index = 0; index < moves.length; index++) {
      if (moves[index].z !== undefined && z !== moves[index].z) {
        z = moves[index].z
        zStart = index
      }

      if (moves[index].e > 0 && z !== zLast) {
        zLast = z

        output.push({
          z,
          move: zStart
        })
      }
    }

    return output
  },

  getLayerCount: (state, getters): number => {
    return getters.getLayers.length
  },

  getToolHeadPosition: (state, getters) => (moveIndex: number): Point3D => {
    const isNaN = Number.isNaN
    const moves = getters.getMoves
    const output = {
      x: NaN,
      y: NaN,
      z: NaN
    }

    for (let i = moveIndex; i >= 0 && isNaN(output.x) && isNaN(output.y) && isNaN(output.z); i--) {
      if (isNaN(output.x) && moves[i].x !== undefined) {
        output.x = moves[i].x
      }

      if (isNaN(output.y) && moves[i].y !== undefined) {
        output.y = moves[i].y
      }

      if (isNaN(output.z) && moves[i].z !== undefined) {
        output.z = moves[i].z
      }
    }

    return {
      x: output.x ?? 0,
      y: output.y ?? 0,
      z: output.z ?? 0
    }
  },

  getPaths: (state, getters) => (startMove: number, endMove: number): LayerPaths => {
    const toolhead = getters.getToolHeadPosition(startMove)
    const moves = getters.getMoves

    const path: LayerPaths = {
      extrusions: '',
      moves: `M ${toolhead.x},${toolhead.y}`,
      retractions: [],
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
          path.extrusions += `M ${toolhead.x},${toolhead.y} `
          traveling = false
        }

        path.extrusions += moveToSVGPath(toolhead, move)
        Object.assign(toolhead, move)
      } else {
        if (!traveling) {
          path.moves += `M ${toolhead.x},${toolhead.y}`
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

    return getters.getPaths(layers[layerNr]?.move ?? 0, layers[layerNr + 1]?.move ?? Infinity)
  },

  getMoveIndexByFilePosition: (state, getters) => (filePosition: number): number => {
    if (filePosition <= 0) {
      return 0
    }

    return binarySearch(getters.getMoves, (val: Move) => filePosition - (val.filePosition ?? 0), true)
  },

  getCurrentMoveIndex: (state, getters, rootState): number => {
    const filePosition = rootState.printer?.printer.virtual_sdcard.file_position

    return getters.getMoveIndexByFilePosition(filePosition)
  },

  getCurrentLayer: (state, getters): LayerNr => {
    const moveIndex = getters.getCurrentMoveIndex
    const layers = getters.getLayers

    for (let index = 0; index < layers.length - 1; index++) {
      if (moveIndex >= layers[index]?.move && moveIndex < (layers[index + 1]?.move ?? Infinity)) {
        return layers[index].move
      }
    }

    return layers[layers.length - 1]?.move ?? 0
  }
}
