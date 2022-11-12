import { Module } from 'vuex'
import { state } from './state'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { TimelapseState } from './types'
import { RootState } from '../types'

const namespaced = true

export const timelapse: Module<TimelapseState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
