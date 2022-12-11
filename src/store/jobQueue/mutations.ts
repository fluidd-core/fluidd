import { MutationTree } from 'vuex'
import { JobQueueState, QueuedJob, QueueState } from './types'
import { defaultState } from './state'

export const mutations: MutationTree<JobQueueState> = {
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setCurrentState (state, payload: { queue_state: QueueState, queued_jobs: QueuedJob[] }) {
    state.queue_state = payload.queue_state
    state.queued_jobs = payload.queued_jobs || []
  }
}
