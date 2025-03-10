import type { GetterTree } from 'vuex'
import type { JobQueueState, QueuedJobWithAppFile } from './types'
import type { RootState } from '../types'
import getFilePaths from '@/util/get-file-paths'

export const getters: GetterTree<JobQueueState, RootState> = {
  getQueuedJobsWithFiles: (state, getters, rootState, rootGetters) => {
    return state.queued_jobs.map((job): QueuedJobWithAppFile => {
      const { rootPath, filename } = getFilePaths(job.filename, 'gcodes')

      return {
        ...job,
        file: rootGetters['files/getFile'](rootPath, filename)
      }
    })
  },

  getQueuedJob: (state) => (jobId: string) => {
    return state.queued_jobs.findIndex(job => job.job_id === jobId)
  }
}
