import { GetterTree } from 'vuex'
import { GcodePreviewState, LayerPaths, Move, Point } from './types'
import { RootState } from '../types'
import { AppFile } from '@/store/files/types'
import { binarySearch } from '@/store/helpers'

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

  getLayers: (state, getters): number[] => {
    return Array.from(getters.getAllLayerStarts.keys())
  },

  getLayerCount: (state, getters): number => {
    return getters.getLayers.length
  },

  getToolHeadPosition: (state, getters) => (moveIndex: number): Point => {
    const isNaN = Number.isNaN
    const moves = getters.getMoves
    const output = {
      x: NaN,
      y: NaN
    }

    for (let i = moveIndex; i >= 0 && isNaN(output.x) && isNaN(output.y); i--) {
      if (isNaN(output.x) && moves[i].x !== undefined) {
        output.x = moves[i].x
      }

      if (isNaN(output.y) && moves[i].y !== undefined) {
        output.y = moves[i].y
      }
    }

    return {
      x: output.x ?? 0,
      y: output.y ?? 0
    }
  },

  getLayerPaths: (state, getters) => (layer: number, filePosition = getters.getLayerEnd(layer)): LayerPaths => {
    let index = getters.getLayerStart(layer)
    const moves = getters.getMoves
    const toolhead = {
      ...getters.getToolHeadPosition(index),
      z: layer
    }

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

    // todo: arcs
    for (; index < moves.length && moves[index].filePosition <= filePosition; index++) {
      const move = moves[index]

      if (move.e > 0) {
        if (traveling) {
          path.extrusions += `M ${toolhead.x},${toolhead.y} `
          traveling = false
        }

        Object.assign(toolhead, move)
        path.extrusions += `L ${toolhead.x},${toolhead.y} `
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

        Object.assign(toolhead, move)
        path.moves += `L ${toolhead.x},${toolhead.y}`
      }
    }

    path.toolhead = {
      x: toolhead.x,
      y: toolhead.y
    }

    return path
  },

  getAllLayerStarts: (state, getters): Map<number, number> => {
    let z = -Infinity
    let zStart = 0
    const output = new Map()
    const moves = getters.getMoves

    for (let index = 0; index < moves.length; index++) {
      if (moves[index].z !== undefined && z !== moves[index].z) {
        z = moves[index].z
        zStart = index
      }

      if (moves[index].e > 0 && !output.has(z)) {
        output.set(z, zStart)
      }
    }

    return output
  },

  getLayerStart: (state, getters) => (layer: number): number => {
    return getters.getAllLayerStarts.get(layer) ?? -1
  },

  getLayerEnd: (state, getters) => (layer: number): number => {
    const layerStarts: [number, number][] = Array.from(getters.getAllLayerStarts.entries())
    const layerIndex = layerStarts.findIndex(value => value[0] === layer)

    if (layerIndex === -1) {
      return 0
    } else if (layerIndex === layerStarts.length - 1) {
      const moves = getters.getMoves

      return moves[moves.length - 1].filePosition ?? Infinity
    } else {
      const moves = getters.getMoves

      return moves[layerStarts[layerIndex][1]].filePosition - 1
    }
  },

  getCurrentMoveIndex: (state, getters, rootState): number => {
    const filePosition = rootState.printer?.printer.virtual_sdcard.file_position

    if (filePosition <= 0) {
      return 0
    }

    return binarySearch(getters.getMoves, (val: Move) => filePosition - (val.filePosition ?? 0), true)
  },

  getCurrentLayer: (state, getters): number => {
    const currentIndex = getters.getCurrentMoveIndex
    const layerStarts: [number, number][] = Array.from(getters.getAllLayerStarts.entries())

    for (let index = 0; index < layerStarts.length - 1; index++) {
      if (currentIndex < layerStarts[index + 1]?.[1]) {
        return layerStarts[index][0]
      }
    }

    return layerStarts[layerStarts.length - 1]?.[0] ?? 0
  }
}
