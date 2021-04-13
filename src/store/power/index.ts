import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { DevicePowerState } from './types'
import { RootState } from '../types'

export const defaultState = (): DevicePowerState => {
  return {
    devices: []
  }
}

export const state = defaultState()

const namespaced = true

export const power: Module<DevicePowerState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
