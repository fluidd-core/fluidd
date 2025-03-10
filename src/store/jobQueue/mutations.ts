import type { MutationTree } from 'vuex'
import type { JobQueueState, QueuedJob, QueueState } from './types'
import { defaultState } from './state'

export const mutations: MutationTree<JobQueueState> = {
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setQueueState (state, payload: QueueState) {
    state.queueState = payload
  },

  setQueuedJobs (state, payload: QueuedJob[]) {
    state.queuedJobs = payload || []
  }
}
