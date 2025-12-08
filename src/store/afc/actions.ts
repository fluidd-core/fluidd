import type { ActionTree } from 'vuex'
import type { RootState } from '../types'
import type { AfcState } from './types'

export const actions = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  }
} satisfies ActionTree<AfcState, RootState>
