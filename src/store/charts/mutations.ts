import { MutationTree } from 'vuex'
import { ChartData, ChartState } from './types'
import { defaultState } from './'

export const mutations: MutationTree<ChartState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  /**
   * Inits the chart store from moonraker.
   */
  setChartStore (state, payload: ChartData[]) {
    state.chart = payload
    state.ready = true
  },

  /**
   * Adds a single chart entry.
   */
  setChartEntry (state, payload: { retention: number; data: ChartData }) {
    // Dont keep data older than our set retention
    state.chart.push(payload.data)
    while (state.chart.length > payload.retention) {
      state.chart.splice(0, 1)
    }
  },

  setSelectedLegends (state, payload) {
    state.selectedLegends = payload
  }
}
