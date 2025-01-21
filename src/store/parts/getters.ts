import type { GetterTree } from 'vuex'
import type { Point, Part, PartsState } from './types'
import type { RootState } from '../types'

export const getters: GetterTree<PartsState, RootState> = {
  getParts: (state): { [key: string]: Part } => {
    return state.parts
  },

  getHasParts: (state): boolean => {
    return Object.keys(state.parts).length > 0
  },

  getIsPartCurrent: (state) => (partName: string): boolean => {
    return state.currentPart === partName
  },

  getIsPartExcluded: (state) => (partName: string): boolean => {
    return state.excludedParts.includes(partName)
  },

  getPartPos: (state, getters) => (partName: string): Point => {
    const p = getters.getParts[partName]
    return p.target
  },

  getPartSVG: (state, getters) => (partName: string): string => {
    const part = getters.getParts[partName]

    let svg = ''
    let op = 'M'

    part.outline.forEach((p: Point) => {
      svg += `${op}${p.x},${p.y}`
      op = 'L'
    })

    svg += 'z'

    return svg
  },

  getPrintState: (state): string => {
    return state.printState
  }
}
