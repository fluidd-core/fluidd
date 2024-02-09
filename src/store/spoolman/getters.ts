import type { GetterTree } from 'vuex'
import type { Spool, SpoolmanState } from './types'
import type { RootState } from '../types'

export const getters: GetterTree<SpoolmanState, RootState> = {
  getActiveSpool: (state) => {
    return state.availableSpools.find(spool => spool.id === state.activeSpool)
  },

  getActiveSpoolId: (state) => {
    return state.activeSpool
  },

  getAvailableSpools: (state) => {
    return state.availableSpools
  },

  getSpoolById: (state) => {
    return (id: number) => state.availableSpools.find((spool: Spool) => spool.id === id)
  },

  getConnected: (state) => {
    return state.connected
  },

  getAvailable: (state) => {
    return state.connected && state.availableSpools.length
  }
}
