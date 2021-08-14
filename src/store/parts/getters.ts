import { GetterTree } from 'vuex'
import { Part, PartsState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<PartsState, RootState> = {
  getParts: (state): {[key: string]: Part} => {
    return state.parts
  },

  getIsPartExcluded: (state, getters) => (partName: string): boolean => {
    return state.excludedParts.includes(partName)
  },

  getPartsSVG: (state, getters): any[] => {
    const psvg = []
    const parts = getters.getParts
    console.log('in getPartsSVG')
    console.log(parts)
    for (const key in parts) {
      let svg = ''
      const p = parts[key]
      svg += `M${p.xmin},${p.ymin}`
      svg += `L${p.xmax},${p.ymin}`
      svg += `L${p.xmax},${p.ymax}`
      svg += `L${p.xmin},${p.ymax}`
      svg += `L${p.xmin},${p.ymin}`
      psvg.push({
        name: p.name,
        svg: svg
      })
    }
    return psvg
  }
}
