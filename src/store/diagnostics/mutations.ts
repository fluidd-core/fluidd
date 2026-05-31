import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { DiagnosticsState } from './types'

export const mutations = {
  setReset (state: DiagnosticsState) {
    Object.assign(state, defaultState())
  },

  setWatchValues (state: DiagnosticsState, values: Record<string, unknown>) {
    state.watchValues = values
  }
} satisfies MutationTree<DiagnosticsState>
