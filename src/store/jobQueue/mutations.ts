import type { MutationTree } from 'vuex'
import type { JobQueueState } from './types'
import { defaultState } from './state'

export const mutations = {
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setQueueState (state, payload: Moonraker.JobQueue.QueueState) {
    state.queueState = payload
  },

  setQueuedJobs (state, payload: Moonraker.JobQueue.QueuedJob[]) {
    state.queuedJobs = payload || []
  }
} satisfies MutationTree<JobQueueState>
