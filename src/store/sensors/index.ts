import type { Module } from 'vuex'
import { state } from './state'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import type { MoonrakerSensorsState } from './types'
import type { RootState } from '../types'

const namespaced = true

export const sensors: Module<MoonrakerSensorsState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
