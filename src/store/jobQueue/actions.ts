import { ActionTree } from 'vuex'
import { JobQueueState } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'

export const actions: ActionTree<JobQueueState, RootState> = {
  async reset ({ commit }) {
    commit('setReset')
  },

  async init () {
    SocketActions.serverJobQueueStatus()
  },

  async onCurrentState ({ commit }, payload) {
    if (payload) {
      commit('setCurrentState', payload)
    }
  }
}
