import type { Module } from 'vuex'
import { createState } from './state'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import type { WebcamsState } from './types'
import type { RootState } from '../types'

export const webcams = {
  namespaced: true,
  state: createState,
  getters,
  actions,
  mutations
} satisfies Module<WebcamsState, RootState>
