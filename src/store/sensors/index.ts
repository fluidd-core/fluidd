import type { Module } from 'vuex'
import type { RootState } from '../types'
import { actions } from './actions'
import { getters } from './getters'
import { mutations } from './mutations'
import { createState } from './state'
import type { MoonrakerSensorsState } from './types'

export const sensors = {
  namespaced: true,
  state: createState,
  getters,
  actions,
  mutations
} satisfies Module<MoonrakerSensorsState, RootState>
