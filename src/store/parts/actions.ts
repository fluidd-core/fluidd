import { ActionTree } from 'vuex'
import { PartsState } from './types'
import { Move } from '../gcodePreview/types'
import { RootState } from '../types'

export const actions: ActionTree<PartsState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async setParts ({ commit }, payload: { moves: Move[] }) {
    commit('setParts', payload.moves)
  },

  async addExcludedPart ({ commit }, payload: { partname: string }) {
    commit('addExcludedPart', payload.partname)
  }
}
