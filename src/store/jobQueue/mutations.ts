import { MutationTree } from 'vuex'
import { JobQueueState } from './types'
import { defaultState } from './state'

export const mutations: MutationTree<JobQueueState> = {
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setCurrentState (state, payload) {
    state.jobs = [...payload.jobs]
    state.queue_state = payload.queue_state
  }
}
