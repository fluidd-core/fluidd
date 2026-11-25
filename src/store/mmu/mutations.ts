import type { MutationTree } from 'vuex'
import { createState } from './state'
import type { MmuDialogState, MmuState } from './types'

export const mutations = {
  /**
   * Reset state
   */
  setReset(state) {
    Object.assign(state, createState())
  },

  setDialogState(state, payload: MmuDialogState) {
    state.dialog = payload
  }
} satisfies MutationTree<MmuState>
