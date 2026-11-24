import type { MutationTree } from 'vuex'
import { createState } from './state'
import type { AfcDialogState, AfcState } from './types'

export const mutations = {
  /**
   * Reset state
   */
  setReset(state) {
    Object.assign(state, createState())
  },

  setDialogState(state, payload: AfcDialogState) {
    state.dialog = payload
  }
} satisfies MutationTree<AfcState>
