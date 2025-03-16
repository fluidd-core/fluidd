import type { MutationTree } from 'vuex'
import type { JobQueueState, QueuedJob, QueueState } from './types'
import { defaultState } from './state'

export const mutations = {
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setQueueState (state, payload: QueueState) {
    state.queueState = payload
  },

  setQueuedJobs (state, payload: QueuedJob[]) {
    state.queuedJobs = payload || []
  }
} satisfies MutationTree<JobQueueState>
