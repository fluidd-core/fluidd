import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import type {
  Spool,
  SpoolmanInfo,
  SpoolmanState,
  SpoolSelectionDialogState
} from '@/store/spoolman/types'

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
    // implies working communication with spoolman server
    state.availableSpools = payload.map(spool => ({
      ...spool,
      registered: new Date(spool.registered),
      first_used: spool.first_used ? new Date(spool.first_used) : undefined,
      last_used: spool.last_used ? new Date(spool.last_used) : undefined
    }))
  },

  setDialogState (state, payload: SpoolSelectionDialogState) {
    state.dialog = payload
  },

  setInfo (state, payload: SpoolmanInfo) {
    state.info = payload
  },

  setCurrency (state, payload: { value: string }) {
    state.currency = payload.value.replace(/^"|"$/g, '')
  },

  setConnected (state, payload) {
    state.connected = payload
  }
}
