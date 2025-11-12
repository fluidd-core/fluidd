import type { ActionTree } from 'vuex'
import type { DatabaseInfo, DatabaseState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'

export const actions = {
  async reset ({ commit }) {
    commit('setReset')
  },

  async init () {
    SocketActions.serverDatabaseList()
  },

  async onServerDatabaseList ({ commit }, payload: DatabaseInfo) {
    commit('setServerDatabaseList', payload)
  },

  async onServerDatabasePostBackup ({ commit }, payload: { backup_path: string }) {
    commit('setServerDatabasePostBackup', payload)
  },

  async onServerDatabaseDeleteBackup ({ commit }, payload: { backup_path: string }) {
    commit('setServerDatabaseDeleteBackup', payload)
  }
} satisfies ActionTree<DatabaseState, RootState>
