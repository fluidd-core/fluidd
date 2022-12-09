import { Module } from 'vuex'
import { state } from './state'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { ServerState } from './types'
import { RootState } from '../types'

const namespaced = true

export const server: Module<ServerState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
