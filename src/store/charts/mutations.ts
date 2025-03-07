import Vue from 'vue'
import type { MutationTree } from 'vuex'
import type { ChartData, ChartState } from './types'
import { defaultState } from './state'

export const mutations: MutationTree<ChartState> = {
  /**
   * Reset state
   */
  setReset (state) {
    // Remove unknown keys first.
    const d = defaultState()
    Object.keys(state).forEach(key => {
      if (!Object.keys(d).includes(key)) delete state[key]
    })

    Object.assign(state, defaultState())
  },

  setResetChartStore (state) {
    const { chart, ready } = defaultState()

    Object.assign(state, {
      chart,
      ready
    })
  },

  /**
   * Init the chart store from db
   */
  setInitCharts (state, payload: ChartState) {
    if (payload) Object.assign(state, payload)
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
  setChartEntry (state, payload: { type: string; retention: number; data: ChartData }) {
    // Dont keep data older than our set retention
    if (!state[payload.type]) {
      Vue.set(state, payload.type, [])
    }
    state[payload.type].push(payload.data)
    const firstInRange = state[payload.type].findIndex((entry: ChartData) => (Date.now() - entry.date.valueOf()) / 1000 < payload.retention)
    if (firstInRange > 0) state[payload.type].splice(0, firstInRange)
  },

  setSelectedLegends (state, payload) {
    state.selectedLegends = payload
  }
}
