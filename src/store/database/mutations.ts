import Vue from 'vue'
import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { DatabaseInfo, DatabaseState } from './types'
import getFilePaths from '@/util/get-file-paths'

export const mutations = {
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setServerDatabaseList (state, payload: DatabaseInfo) {
    Vue.set(state, 'info', payload)
  },

  setServerDatabasePostBackup (state, payload: { backup_path: string }) {
    if (state.info?.backups) {
      const { filename } = getFilePaths(payload.backup_path)

      state.info.backups.push(filename)
    }
  },

  setServerDatabaseDeleteBackup (state, payload: { backup_path: string }) {
    if (state.info?.backups) {
      const { filename } = getFilePaths(payload.backup_path)
      const index = state.info.backups.findIndex(backup => backup === filename)

      if (index >= 0) {
        state.info.backups.splice(index, 1)
      }
    }
  }
} satisfies MutationTree<DatabaseState>
