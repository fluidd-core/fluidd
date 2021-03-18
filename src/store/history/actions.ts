import { ActionTree } from 'vuex'
import { HistoryItem, HistoryState } from './types'
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
  async onInit ({ commit }, payload: { count: number; jobs?: HistoryItem[] }) {
    if (payload) {
      commit('setInitHistory', payload)
    }
  },

  /**
   * History has changed, update the data.
   */
  async onHistoryChange ({ commit }, payload: { action: string; job: HistoryItem }) {
    console.log('got a change event for history.', payload)
    if (
      payload
    ) {
      if (payload.action === 'added') commit('setAddHistory', payload.job)
      if (payload.action === 'finished') commit('setUpdateHistory', payload.job)
    }
  },

  async onDelete ({ commit }, payload) {
    commit('setDeleteJob', payload.deleted_jobs)
  },

  async onDeleteAll ({ commit }) {
    commit('setDeleteAllJobs')
  }
}
