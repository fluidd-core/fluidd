import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { GpioState } from './types'
import { RootState } from '../types'

export const defaultState = (): GpioState => {
  return {
    devices: []
  }
}

export const state = defaultState()

const namespaced = true

export const gpio: Module<GpioState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
