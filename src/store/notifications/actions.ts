import { ActionTree } from 'vuex'
import { NotificationsState } from './types'
import { RootState } from '../types'

export const actions: ActionTree<NotificationsState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  }
}
