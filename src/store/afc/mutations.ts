import type { MutationTree } from 'vuex'
import type { AfcDialogState, AfcState } from './types'
import { defaultState } from './state'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setDialogState (state, payload: AfcDialogState) {
    state.dialog = payload
  },
} satisfies MutationTree<AfcState>
