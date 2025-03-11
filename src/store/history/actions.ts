import type { ActionTree } from 'vuex'
import type { HistoryItem, HistoryState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'
import getFilePaths from '@/util/get-file-paths'

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

  async updateHistory ({ commit }, payload) {
    if (payload) {
      commit('setUpdateHistory', payload)
    }
  },

  async clearHistoryThumbnails ({ commit }, payload) {
    if (payload) {
      commit('setClearHistoryThumbnails', payload)
    }
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
  async onHistoryChange ({ commit, rootState }, payload: { action: 'added' | 'finished'; job: HistoryItem }) {
    SocketActions.serverHistoryTotals()

    if (payload) {
      switch (payload.action) {
        case 'added': {
          commit('setAddHistory', payload.job)

          const { rootPath, filename } = getFilePaths(payload.job.filename, 'gcodes')

          const pathContent = rootState.files.pathContent[rootPath]

          // If the file is known, then update the file metadata
          if (pathContent != null && pathContent.files.some(file => file.filename === filename)) {
            SocketActions.serverFilesMetadata(payload.job.filename)
          }

          break
        }
        case 'finished':
          commit('setUpdateHistory', payload.job)

          break
      }
    }
  },

  async onDelete ({ commit }, payload) {
    commit('setDeleteJob', payload.deleted_jobs)
  }
}
