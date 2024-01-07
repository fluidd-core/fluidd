import type { ActionTree } from 'vuex'
import type { Spool, SpoolmanState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'

export const actions: ActionTree<SpoolmanState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Make a socket request to init the spoolman component.
   */
  async init () {
    SocketActions.serverSpoolmanGetSpoolId()
    SocketActions.serverSpoolmanProxyGetAvailableSpools()
  },

  async onActiveSpool ({ commit }, payload) {
    commit('setActiveSpool', payload.spool_id)
  },

  async onSpoolChange ({ commit, getters }, { type, payload }) {
    const spools = getters.getAvailableSpools
    switch (type) {
      case 'added': {
        spools.push(payload)
        break
      }

      case 'updated': {
        const index = spools.findIndex((spool: Spool) => spool.id === payload.id)
        spools[index] = payload

        break
      }

      case 'deleted': {
        const index = spools.findIndex((spool: Spool) => spool.id === payload.id)
        spools.splice(index, 1)
        break
      }
    }

    commit('setAvailableSpools', spools)
  },

  async onAvailableSpools ({ commit }, payload) {
    commit('setAvailableSpools', [...payload])
  }
}
