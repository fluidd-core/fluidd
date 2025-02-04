import type { GetterTree } from 'vuex'
import type { JobQueueState } from './types'
import type { RootState } from '../types'

export const getters: GetterTree<JobQueueState, RootState> = {
  getQueuedJob: (state) => (jobId: string) => {
    return state.queued_jobs.findIndex(job => job.job_id === jobId)
  }
}
