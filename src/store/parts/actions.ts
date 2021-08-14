import { ActionTree } from 'vuex'
import { Part, PartsState } from './types'
import { RootState } from '../types'

export const actions: ActionTree<PartsState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async setParts ({ commit }, payload: { parts: Part[] }) {
    commit('setParts', payload.parts)
  },

  async addExcludedPart ({ commit }, payload: { partname: string }) {
    commit('addExcludedPart', payload.partname)
  }
}
