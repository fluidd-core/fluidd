import type { Module } from 'vuex'
import { state } from './state'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import type { AuthState } from './types'
import type { RootState } from '../types'

const namespaced = true

export const auth = {
  namespaced,
  state,
  getters,
  actions,
  mutations
} satisfies Module<AuthState, RootState>
