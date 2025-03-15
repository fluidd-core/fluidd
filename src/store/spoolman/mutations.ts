import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import type {
  SpoolmanInfo,
  SpoolmanSpool,
  SpoolmanState,
  SpoolSelectionDialogState
} from '@/store/spoolman/types'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setActiveSpool (state, payload: number) {
    state.activeSpool = payload
  },

  setSpools (state, payload: SpoolmanSpool[]) {
    state.spools = payload
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
} satisfies MutationTree<SpoolmanState>
