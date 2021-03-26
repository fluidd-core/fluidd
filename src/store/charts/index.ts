import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { ChartState } from './types'
import { RootState } from '../types'

/**
 * Maintains the state of the console
 */
export const defaultState = (): ChartState => {
  return {
    ready: false,
    chart: [],
    selectedLegends: {}
  }
}

export const state = defaultState()

const namespaced = true

export const charts: Module<ChartState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
