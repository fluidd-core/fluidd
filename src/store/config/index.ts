import type { Module } from 'vuex'
import { createState } from './state'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import type { ConfigState } from './types'
import type { RootState } from '../types'

export const config = {
  namespaced: true,
  state: createState,
  getters,
  actions,
  mutations
} satisfies Module<ConfigState, RootState>
