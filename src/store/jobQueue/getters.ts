import { GetterTree } from 'vuex'
import { JobQueueState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<JobQueueState, RootState> = {
  getQueueState: (state) => {
    return state.queue_state
  },

  getJobs: (state) => {
    return state.jobs
  },

  getJob: (state) => (jobId: string) => {
    return state.jobs.findIndex(job => job.job_id === jobId)
  }
}
