import type { GetterTree } from 'vuex'
import type { JobQueueState, QueuedJobWithAppFile } from './types'
import type { RootState } from '../types'
import getFilePaths from '@/util/get-file-paths'

export const getters = {
  getQueuedJobsWithFiles: (state, getters, rootState, rootGetters) => {
    return state.queuedJobs.map((job): QueuedJobWithAppFile => {
      const { rootPath, filename } = getFilePaths(job.filename, 'gcodes')

      return {
        ...job,
        file: rootGetters['files/getFile'](rootPath, filename)
      }
    })
  },
} satisfies GetterTree<JobQueueState, RootState>
