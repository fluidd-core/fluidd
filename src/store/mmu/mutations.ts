import type { MutationTree } from 'vuex'
import type { MmuDialogState, MmuState } from './types'
import { createState } from './state'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, createState())
  },

  setDialogState (state, payload: MmuDialogState) {
    state.dialog = payload
  },
} satisfies MutationTree<MmuState>
