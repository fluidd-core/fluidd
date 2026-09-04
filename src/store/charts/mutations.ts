import Vue from 'vue'
import type { MutationTree } from 'vuex'
import { appendChartSamples, createChartBuffer, resizeChartBuffer } from '@/util/chart-buffer'
import { Globals } from '@/globals'
import type { ChartBucket, ChartBuffer, ChartEntriesPayload, ChartEntryPayload, ChartsDbDocument, ChartSelectedLegends, ChartState } from './types'
import { state as defaultState } from './state'

const resolveBuffer = (state: ChartState, payload: ChartBucket): ChartBuffer => {
  switch (payload.bucket) {
    case 'mcu':
    case 'sensor': {
      const group = payload.bucket === 'mcu'
        ? state.mcus
        : state.sensors

      if (!group[payload.id]) {
        Vue.set(group, payload.id, createChartBuffer(Globals.CHART_SYSTEM_RETENTION))
      }

      return group[payload.id]
    }

    default: {
      const buffer = state[payload.bucket]

      if ('retention' in payload) {
        resizeChartBuffer(buffer, payload.retention)
      }

      return buffer
    }
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

  setChartEntry (state, payload: ChartEntryPayload) {
    appendChartSamples(resolveBuffer(state, payload), [payload])
  },

  setChartEntries (state, payload: ChartEntriesPayload) {
    appendChartSamples(resolveBuffer(state, payload), payload.samples)
  },

  setSelectedLegends (state, payload: ChartSelectedLegends) {
    state.selectedLegends = payload
  }
} satisfies MutationTree<ChartState>
