import type { ActionTree } from 'vuex'
import type { JobQueueState, QueuedJob, QueueState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import getFilePaths from '@/util/get-file-paths'

export const actions: ActionTree<JobQueueState, RootState> = {
  async reset ({ commit }) {
    commit('setReset')
  },

  async init () {
    SocketActions.serverJobQueueStatus()
  },

  async updateJobsMetadata ({ state, rootState }) {
    const pathFilenames = new Set(
      state.queued_jobs
        .map(job => job.filename)
    )

    for (const pathFilename of pathFilenames) {
      const { rootPath, filename } = getFilePaths(pathFilename, 'gcodes')

      const pathContent = rootState.files.pathContent[rootPath]

      if (pathContent == null || !pathContent.files.some(file => file.filename === filename)) {
        SocketActions.serverFilesMetadata(pathFilename)
      }
    }
  },

  async onJobQueueStatus ({ commit, dispatch }, payload : { queue_state: QueueState, queued_jobs: QueuedJob[] }) {
    if (payload) {
      commit('setQueueState', payload.queue_state)
      commit('setQueuedJobs', payload.queued_jobs)

      dispatch('updateJobsMetadata')
    }
  },

  async onJobQueueChanged ({ commit, dispatch }, payload : { action: string, queue_state?: QueueState, updated_queue?: QueuedJob[] | null }) {
    if (payload) {
      const { queue_state, updated_queue } = payload

      if (queue_state) {
        commit('setQueueState', queue_state)
      }

      if (updated_queue != null) {
        commit('setQueuedJobs', updated_queue)

        dispatch('updateJobsMetadata')
      }
    }
  }
}
