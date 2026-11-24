import type { MutationTree } from 'vuex'
import { createState } from './state'
import type { JobQueueState } from './types'

export const mutations = {
  setReset(state) {
    Object.assign(state, createState())
  },

  setQueueState(state, payload: Moonraker.JobQueue.QueueState) {
    state.queueState = payload
  },

  setQueuedJobs(state, payload: Moonraker.JobQueue.QueuedJob[]) {
    state.queuedJobs = Object.freeze(payload || [])
  }
} satisfies MutationTree<JobQueueState>
