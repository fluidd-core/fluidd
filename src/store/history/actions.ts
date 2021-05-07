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
   * Inits moonraker component
   */
  async init () {
    // Get the last 50 history items.
    SocketActions.serverHistoryList({ limit: Globals.JOB_HISTORY_LOAD })

    // Load the known totals.
    SocketActions.serverHistoryTotals()
  },

  /**
   * Update the store with history totals data
   */
  async onHistoryTotals ({ commit }, payload) {
    if (payload) {
      commit('setHistoryTotals', payload)
    }
  },

  /**
   * Update the store with history
   */
  async onHistoryList ({ commit }, payload) {
    if (payload) {
      commit('setHistoryList', payload)
    }
  },

  /**
   * History has changed, update the data.
   */
  async onHistoryChange ({ commit }, payload: { action: string; job: HistoryItem }) {
    SocketActions.serverHistoryTotals()
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
