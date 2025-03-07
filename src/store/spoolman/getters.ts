import type { GetterTree } from 'vuex'
import type { Spool, SpoolmanState } from './types'
import type { RootState } from '../types'

export const getters: GetterTree<SpoolmanState, RootState> = {
  getActiveSpool: (state) => {
    return state.availableSpools.find(spool => spool.id === state.activeSpool)
  },

  getSpoolById: (state) => {
    return (id: number) => state.availableSpools.find((spool: Spool) => spool.id === id)
  },

  getAvailable: (state) => {
    return (
      state.connected &&
      state.availableSpools.length > 0
    )
  }
}
