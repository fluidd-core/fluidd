import { ActionTree } from 'vuex'
import { WaitState } from './types'
import { RootState } from '../types'

export const actions: ActionTree<WaitState, RootState> = {
  async addWait ({ commit }, wait) {
    commit('addWait', wait)
  },
  async removeWait ({ commit }, wait) {
    commit('removeWait', wait)
  }
}
