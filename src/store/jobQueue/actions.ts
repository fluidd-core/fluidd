import { ActionTree } from 'vuex'
import { JobQueueState } from './types'
import { RootState } from '../types'

export const actions: ActionTree<JobQueueState, RootState> = {
  async reset ({ commit }) {
    commit('setReset')
  },

  async onCurrentState ({ commit }, payload) {
    commit('setCurrentState', payload)
  }
}
