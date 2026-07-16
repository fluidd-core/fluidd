import { markRaw } from 'vue'
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
    state.socket?.close()
    Object.assign(state, defaultState())
  },

  setActiveSpool (state, payload: number | null) {
    state.activeSpool = payload
  },

  setExtruderSpools (state, payload: Partial<Record<string, number | null>>) {
    state.activeSpoolsByExtruder = payload
  },

  setExtruderSpool (state, { extruder, spoolId }: { extruder: string, spoolId: number | null }) {
    state.activeSpoolsByExtruder = { ...state.activeSpoolsByExtruder, [extruder]: spoolId }
  },

  setSpools (state, payload: Moonraker.Spoolman.Spool[]) {
    state.spools = Object.freeze(payload)
  },

  setDialogState (state, payload: SpoolSelectionDialogState) {
    state.dialog = payload
  },

  setInfo (state, payload: Moonraker.Spoolman.Info) {
    state.info = Object.freeze(payload)
  },

  setCurrency (state, payload: Moonraker.Spoolman.Currency) {
    state.currency = payload.value.replace(/^"|"$/g, '')
  },

  setConnected (state, payload: boolean) {
    state.connected = payload
  },

  setSocket (state, payload: WebSocket | null) {
    state.socket?.close()
    state.socket = payload != null ? markRaw(payload) : null
  }
} satisfies MutationTree<SpoolmanState>
