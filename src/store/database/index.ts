import type { Module } from 'vuex'
import { state } from './state'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import type { DatabaseState } from './types'
import type { RootState } from '../types'

const namespaced = true

export const database = {
  namespaced,
  state,
  getters,
  actions,
  mutations
} satisfies Module<DatabaseState, RootState>
