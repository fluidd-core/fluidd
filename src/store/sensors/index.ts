import type { Module } from 'vuex'
import { createState } from './state'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import type { MoonrakerSensorsState } from './types'
import type { RootState } from '../types'

export const sensors = {
  namespaced: true,
  state: createState,
  getters,
  actions,
  mutations
} satisfies Module<MoonrakerSensorsState, RootState>
