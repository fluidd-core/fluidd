import { ActionTree } from 'vuex'
import { PartsState } from './types'
import { RootState } from '../types'

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
