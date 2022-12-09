import { Module } from 'vuex'
import { state } from './state'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { PartsState } from './types'
import { RootState } from '../types'

const namespaced = true

export const parts: Module<PartsState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
