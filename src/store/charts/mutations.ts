import Vue from 'vue'
import type { MutationTree } from 'vuex'
import { appendChartSample, createChartBuffer, resizeChartBuffer } from '@/util/chart-buffer'
import type { ChartBuffer, ChartEntryPayload, ChartsDbDocument, ChartSelectedLegends, ChartState } from './types'
import { defaultState } from './state'

const resolveBuffer = (state: ChartState, payload: ChartEntryPayload): ChartBuffer => {
  switch (payload.bucket) {
    case 'mcu':
    case 'sensor': {
      const group = payload.bucket === 'mcu'
        ? state.mcus
        : state.sensors

      if (!group[payload.id]) {
        Vue.set(group, payload.id, createChartBuffer(payload.retention))
      }

      return group[payload.id]
    }

    default:
      return state[payload.bucket]
  }
}

export const mutations = {
  /**
   * Reset our store
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setResetChartStore (state) {
    const { thermal, ready } = defaultState()

    Object.assign(state, {
      thermal,
      ready
    })
  },

  /**
   * Init the chart store from db
   */
  setInitCharts (state, payload: ChartsDbDocument) {
    if (payload?.selectedLegends) state.selectedLegends = payload.selectedLegends
  },

  /**
   * Inits the chart store from moonraker.
   */
  setThermalStore (state, payload: ChartBuffer) {
    state.thermal = payload
    state.ready = true
  },

  setMoonrakerStore (state, payload: ChartBuffer) {
    state.moonraker = payload
  },

  setChartEntry (state, payload: ChartEntryPayload) {
    const buffer = resolveBuffer(state, payload)

    resizeChartBuffer(buffer, payload.retention)
    appendChartSample(buffer, payload.time, payload.values)
  },

  setSelectedLegends (state, payload: ChartSelectedLegends) {
    state.selectedLegends = payload
  }
} satisfies MutationTree<ChartState>
