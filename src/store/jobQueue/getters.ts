import type { GetterTree } from 'vuex'
import type { JobQueueState } from './types'
import type { RootState } from '../types'

export const getters: GetterTree<JobQueueState, RootState> = {
  getQueueState: (state) => {
    return state.queue_state
  },

  getQueuedJobs: (state) => {
    return state.queued_jobs
  },

  getQueuedJob: (state) => (jobId: string) => {
    return state.queued_jobs.findIndex(job => job.job_id === jobId)
  }
}
