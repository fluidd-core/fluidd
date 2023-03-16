import { GetterTree } from 'vuex'
import { JobQueueState } from './types'
import { RootState } from '../types'

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
