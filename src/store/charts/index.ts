import { Module } from 'vuex'
import { state } from './state'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { ChartState } from './types'
import { RootState } from '../types'

const namespaced = true

export const charts: Module<ChartState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
