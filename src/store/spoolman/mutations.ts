import { MutationTree } from 'vuex'
import { defaultState } from './state'
import { Spool, SpoolmanState } from '@/store/spoolman/types'

export const mutations: MutationTree<SpoolmanState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setActiveSpool (state, payload: number) {
    state.activeSpool = payload
  },

  setAvailableSpools (state, payload: Spool[]) {
    state.availableSpools = payload
  }
}
