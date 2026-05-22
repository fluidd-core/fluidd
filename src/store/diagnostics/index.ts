import type { Module } from 'vuex'
import type { RootState } from '../types'
import { state } from './state'
import { mutations } from './mutations'
import { actions } from './actions'
import type { DiagnosticsState } from './types'

export const diagnostics = {
  namespaced: true,
  state,
  mutations,
  actions
} satisfies Module<DiagnosticsState, RootState>
