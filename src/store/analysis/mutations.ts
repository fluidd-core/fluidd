import type { MutationTree } from 'vuex'
import type { AnalysisState, AnalysisStatus } from './types'
import { defaultState } from './state'

export const mutations: MutationTree<AnalysisState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setAnalysisStatus (state, payload: AnalysisStatus) {
    state.status = payload
  }
}
