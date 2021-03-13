import { ActionTree } from 'vuex'
import { HistoryState } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/socketActions'
import { Globals } from '@/globals'

export const actions: ActionTree<HistoryState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Inits plugin
   */
  async init () {
    SocketActions.serverHistoryList(Globals.HISTORY_RETENTION)
  },

  /**
   * Init the store with history data
   */
  async onInit ({ commit }, payload) {
    if (payload) commit('setInitHistory', payload)
  }
}
