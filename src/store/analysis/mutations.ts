import type { MutationTree } from 'vuex'
import type { AnalysisState } from './types'
import { defaultState } from './state'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setAnalysisStatus (state, payload: Moonraker.Analysis.StatusResponse) {
    state.status = payload
  }
} satisfies MutationTree<AnalysisState>
