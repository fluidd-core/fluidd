import type { ActionTree } from 'vuex'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'
import { appendChartSample, createChartBuffer } from '@/util/chart-buffer'
import type { ChartsDbDocument, ChartSelectedLegends, ChartState } from './types'
import { thermalColumn } from './thermal-columns'
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
  async initTempStore ({ commit, rootGetters, rootState }, payload: Moonraker.DataStore.TemperatureStoreResponse) {
    const now = new Date() // Set a base time to work out the temp data from.
    // On a fresh boot of the host system, moonraker should give us enough data;
    // however, it seems sometimes it does not. So - we should pad this out when
    // we need to.
    // Otherwise, for a system that has been running for a bit - we should expect
    // enough data from moonraker to start with.

    // Note that some items come back with targets when they should not,
    // so we have to account for this too.

    // how many datasets to add. Moonraker should give us 20 minutes, in 1 second intervals.. but we only need 10 minutes.
    const retention = rootGetters['charts/getChartRetention']
    const targetsToAvoid = [
      'temperature_probe',
      'temperature_sensor'
    ]

    if (
      payload &&
      Object.keys(payload).length === 0
    ) {
      // Empty chart data
      commit('setThermalStore', createChartBuffer(retention))
      return
    }

    for (const originalKey in payload) { // each heater / temp fan
      // If the dataset is less than what we need, then pad the beginning
      // until we get to our intended count
      if (targetsToAvoid.some(e => originalKey.startsWith(e))) {
        delete payload[originalKey].targets
      }

      const keys: (keyof Moonraker.DataStore.TemperatureStoreEntry)[] = [
        'temperatures', 'targets', 'powers', 'speeds'
      ]

      keys.forEach((k) => {
        const arr = payload[originalKey][k]
        if (arr && arr.length) {
          if (arr.length < retention) {
            const length = retention - arr.length
            const lastValue = arr[0]
            payload[originalKey][k] = [...Array.from({ length }, () => lastValue), ...arr]
          } else {
            payload[originalKey][k] = arr.splice(arr.length - retention)
          }
        }
      })
    }

    const keys = Object.keys(payload)
    const buffer = createChartBuffer(retention)

    for (let i = 0; i < retention; i++) {
      const date = new Date(now.getTime() - (1000 * (retention - i)) - 2000)
      const values: Record<string, number> = {}

      keys.forEach(key => {
        if (rootState.printer.printer[key]) {
          values[key] = payload[key].temperatures[i]
          if (payload[key].targets != null) values[thermalColumn(key, 'target')] = payload[key].targets[i]
          if (payload[key].powers != null) values[thermalColumn(key, 'power')] = payload[key].powers[i]
          if (payload[key].speeds != null) values[thermalColumn(key, 'speed')] = payload[key].speeds[i]
        }
      })

      appendChartSample(buffer, date.getTime(), values)
    }

    commit('setThermalStore', buffer)
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
