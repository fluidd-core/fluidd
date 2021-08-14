import { MutationTree } from 'vuex'
import { defaultState } from '.'
import { Part, PartsState } from './types'
import Vue from 'vue'

export const mutations: MutationTree<PartsState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setParts (state, parts: Part[]) {
    const partMap: { [key: string]: Part} = {}

    parts.forEach(part => {
      partMap[part.name] = part
    })
    Vue.set(state, 'parts', Object.freeze(partMap))
  },

  addExcludedPart (state, partName: string) {
    const newList = [...state.excludedParts]
    newList.push(partName)
    Vue.set(state, 'excludedParts', Object.freeze(newList))
  }
}
