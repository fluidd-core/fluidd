import type { GetterTree } from 'vuex'
import getFilePaths from '@/util/get-file-paths'
import type { RootState } from '../types'
import type { JobQueueState, QueuedJobWithAppFile } from './types'

export const getters = {
  getQueuedJobsWithFiles: (state, getters, rootState, rootGetters) => {
    return state.queuedJobs.map((job): QueuedJobWithAppFile => {
      const { rootPath, filename } = getFilePaths(job.filename, 'gcodes')

      return {
        ...job,
        file: rootGetters['files/getFile'](rootPath, filename)
      }
    })
  }
} satisfies GetterTree<JobQueueState, RootState>
