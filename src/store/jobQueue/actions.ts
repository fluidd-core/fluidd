import type { ActionTree } from 'vuex'
import type { JobQueueState, QueuedJob, QueueState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'

export const actions: ActionTree<JobQueueState, RootState> = {
  async reset ({ commit }) {
    commit('setReset')
  },

  async init () {
    SocketActions.serverJobQueueStatus()
  },

  async onJobQueueStatus ({ commit }, payload : { queue_state: QueueState, queued_jobs: QueuedJob[] }) {
    if (payload) {
      commit('setQueueState', payload.queue_state)
      commit('setQueuedJobs', payload.queued_jobs)
    }
  },

  async onJobQueueChanged ({ commit }, payload : { action: string, queue_state?: QueueState, updated_queue?: QueuedJob[] | null }) {
    if (payload) {
      const { queue_state, updated_queue } = payload

      if (queue_state) {
        commit('setQueueState', queue_state)
      }

      if (updated_queue !== undefined && updated_queue !== null) {
        commit('setQueuedJobs', updated_queue)
      }
    }
  }
}
