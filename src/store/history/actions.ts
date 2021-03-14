import { ActionTree } from 'vuex'
import { HistoryItem, HistoryState } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/socketActions'
import { Globals } from '@/globals'
import { getFilePaths } from '../helpers'

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

      // Ensure we have file data for the items in our history.
      if (payload.jobs) {
        payload.jobs.forEach((job) => {
          // Preload any related dirs.
          const root = 'gcodes'
          const filePath = getFilePaths(job.filename, root)
          SocketActions.serverFilesGetDirectory(root, filePath.rootPath)
        })
      }
    }
  },

  /**
   * History has changed, update the data.
   */
  async onHistoryChange ({ commit }, payload: { action: string; job: HistoryItem }) {
    if (
      payload
    ) {
      if (payload.action === 'added') commit('addHistory', payload.job)
      if (payload.action === 'finished') commit('updateHistory', payload.job)
    }
  }
}
