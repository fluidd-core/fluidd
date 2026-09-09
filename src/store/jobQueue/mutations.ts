import type { MutationTree } from 'vuex'
import type { JobQueueState } from './types'
import { createState } from './state'

export const mutations = {
  setReset (state) {
    Object.assign(state, createState())
  },

  setQueueState (state, payload: Moonraker.JobQueue.QueueState) {
    state.queueState = payload
  },

  setQueuedJobs (state, payload: Moonraker.JobQueue.QueuedJob[]) {
    state.queuedJobs = Object.freeze(payload || [])
  }
} satisfies MutationTree<JobQueueState>
