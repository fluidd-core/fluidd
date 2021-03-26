import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { MacrosState } from './types'
import { RootState } from '../types'

/**
 * Maintains the state of the console
 */
export const defaultState = (): MacrosState => {
  return {
    stored: []
  }
}

export const state = defaultState()

const namespaced = true

export const macros: Module<MacrosState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
