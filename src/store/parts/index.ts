import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { PartsState } from './types'
import { RootState } from '../types'

/**
 * Maintains the state of the console
 */
export const defaultState = (): PartsState => {
  return {
    parts: {},
    excludedParts: [],
    printState: 'unknown'
  }
}

export const state = defaultState()

const namespaced = true

export const parts: Module<PartsState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
