import type { ActionTree } from 'vuex'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'
import type { ChartsDbDocument, ChartSelectedLegends, ChartState } from './types'
import { buildThermalHistoryBuffer } from './thermal-history'
import { moonrakerChartSamples } from './moonraker-history'
import { chartBufferLastTime } from '@/util/chart-buffer'
import type { RootState } from '../types'
import { isEqual } from 'lodash-es'

export const actions = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async resetChartStore ({ commit }) {
    commit('setResetChartStore')
  },

  /**
   * Loads stored server data for the past 20 minutes.
   */
  async initTempStore ({ commit, rootGetters }, payload: Moonraker.DataStore.TemperatureStoreResponse) {
    const buffer = buildThermalHistoryBuffer(
      payload,
      rootGetters['printer/getChartableSensors'],
      rootGetters['charts/getChartRetention'],
      // Leave a gap so history doesn't collide with the first live sample.
      Date.now() - 2000
    )

    commit('setThermalStore', buffer)
  },

  /**
   * Adds Moonraker's process stats - a backlog on connect, one sample when live.
   */
  async onMoonrakerStats ({ commit, state }, payload: Moonraker.ProcStats.MoonrakerStats | readonly Moonraker.ProcStats.MoonrakerStats[]) {
    const stats = Array.isArray(payload)
      ? payload
      : [payload]

    commit('setChartEntries', {
      bucket: 'moonraker',
      samples: moonrakerChartSamples(stats, chartBufferLastTime(state.moonraker) ?? -Infinity)
    })
  },

  /**
   * Init the chart state from db - only ever `selectedLegends`.
   */
  initCharts ({ commit }, payload: ChartsDbDocument) {
    commit('setInitCharts', payload)
  },

  /**
   * Saves current state of selected legends to store and db
   */
  saveSelectedLegends ({ commit, state }, payload: ChartSelectedLegends) {
    // Only change the data if they require it
    if (!isEqual(state.selectedLegends, payload)) {
      commit('setSelectedLegends', payload)
      SocketActions.serverDatabasePostItem(Globals.MOONRAKER_DB.fluidd.ROOTS.charts.name + '.selectedLegends', payload)
    }
  }
} satisfies ActionTree<ChartState, RootState>
