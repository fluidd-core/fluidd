import type { ActionTree } from 'vuex'
import type { PartsState } from './types'
import type { RootState } from '../types'

export const actions: ActionTree<PartsState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async onPartUpdate ({ commit }, payload) {
    commit('partUpdate', payload)
  },

  async onPrintStatsUpdate ({ commit }, payload) {
    commit('printStatsUpdate', payload)
  }
}
