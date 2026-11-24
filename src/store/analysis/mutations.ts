import type { MutationTree } from 'vuex'
import { createState } from './state'
import type { AnalysisState } from './types'

export const mutations = {
  /**
   * Reset state
   */
  setReset(state) {
    Object.assign(state, createState())
  },

  setAnalysisStatus(state, payload: Moonraker.Analysis.StatusResponse) {
    state.status = payload
  }
} satisfies MutationTree<AnalysisState>
