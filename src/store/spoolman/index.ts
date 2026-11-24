import type { Module } from 'vuex'
import type { RootState } from '../types'
import { actions } from './actions'
import { getters } from './getters'
import { mutations } from './mutations'
import { createState } from './state'
import type { SpoolmanState } from './types'

export const spoolman = {
  namespaced: true,
  state: createState,
  getters,
  actions,
  mutations
} satisfies Module<SpoolmanState, RootState>
