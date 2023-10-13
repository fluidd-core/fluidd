import type { Module } from 'vuex'
import { state } from './state'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import type { MacrosState } from './types'
import type { RootState } from '../types'

const namespaced = true

export const macros: Module<MacrosState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
