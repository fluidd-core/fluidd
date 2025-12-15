import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import type {
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

  setSpools (state, payload: Moonraker.Spoolman.Spool[]) {
    state.spools = payload
  },

  setDialogState (state, payload: SpoolSelectionDialogState) {
    state.dialog = payload
  },

  setInfo (state, payload: Moonraker.Spoolman.Info) {
    state.info = payload
  },

  setCurrency (state, payload: Moonraker.Spoolman.Currency) {
    state.currency = payload.value.replace(/^"|"$/g, '')
  },

  setConnected (state, payload) {
    state.connected = payload
  }
} satisfies MutationTree<SpoolmanState>
