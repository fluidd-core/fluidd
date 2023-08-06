import { GetterTree } from 'vuex'
import { SpoolmanState } from './types'
import { RootState } from '../types'

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

  getSupported: (state) => {
    return state.supported
  }
}
