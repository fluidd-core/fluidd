import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { HistoryState } from './types'
import { RootState } from '../types'

/**
 * Maintains the state of the console
 */
export const defaultState = (): HistoryState => {
  return {
    count: 0,
    jobs: []
  }
}

export const state = defaultState()

const namespaced = true

export const history: Module<HistoryState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
