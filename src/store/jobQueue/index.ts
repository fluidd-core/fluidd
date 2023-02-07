import { Module } from 'vuex'
import { state } from './state'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { JobQueueState } from './types'
import { RootState } from '../types'

const namespaced = true

export const jobQueue: Module<JobQueueState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
