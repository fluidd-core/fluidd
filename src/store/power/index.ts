import type { Module } from 'vuex'
import type { RootState } from '../types'
import { actions } from './actions'
import { getters } from './getters'
import { mutations } from './mutations'
import { createState } from './state'
import type { DevicePowerState } from './types'

export const power = {
  namespaced: true,
  state: createState,
  getters,
  actions,
  mutations
} satisfies Module<DevicePowerState, RootState>
