import { ActionTree } from 'vuex'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'
import { ChartData, ChartState } from './types'
import { RootState } from '../types'
import { isEqual } from 'lodash-es'

export const actions: ActionTree<ChartState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Loads stored server data for the past 20 minutes.
   */
  async initTempStore ({ commit, rootGetters, rootState }, payload) {
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
      commit('setChartStore', [])
      return
    }

    for (const originalKey in payload) { // each heater / temp fan
      // If the dataset is less than what we need, then pad the beginning
      // until we get to our intended count
      if (targetsToAvoid.some(e => originalKey.startsWith(e))) {
        delete payload[originalKey].targets
      }
      ['temperatures', 'targets', 'powers', 'speeds'].forEach((k) => {
        const arr = payload[originalKey][k]
        if (arr && arr.length) {
          if (arr.length < retention) {
            const length = retention - arr.length
            const lastValue = payload[originalKey][k][0]
            payload[originalKey][k] = [...Array.from({ length }, () => lastValue), ...payload[originalKey][k]]
          } else {
            payload[originalKey][k] = payload[originalKey][k].splice(arr.length - retention)
          }
        }
      })
    }

    const keys = Object.keys(payload)
    const d: ChartData[] = []
    for (let i = 0; i < retention; i++) {
      const date = new Date(now.getTime() - (1000 * (retention - i)) - 2000)
      const r: ChartData = {
        date
      }
      keys.forEach(key => {
        let label = key
        if (key.includes(' ')) label = key.split(' ')[1]

        if (rootState.printer?.printer[key]) {
          const temp = rootState.printer?.printer[key].temperature || 0
          const target = rootState.printer?.printer[key].target || 0
          const power = rootState.printer?.printer[key].power || 0
          const speed = rootState.printer?.printer[key].speed || 0

          r[label] = payload[key].temperatures[i] || temp
          if ('targets' in payload[key]) r[`${label}Target`] = payload[key].targets[i] || target
          if ('powers' in payload[key]) r[`${label}Power`] = payload[key].powers[i] || power
          if ('speeds' in payload[key]) r[`${label}Speed`] = payload[key].speeds[i] || speed
        }
      })
      d.push(r)
    }
    commit('setChartStore', d)
  },

  /**
   * Init the chart state from db
   */
  initCharts ({ commit }, payload) {
    commit('setInitCharts', payload)
  },

  /**
   * Saves current state of selected legends to store and db
   */
  saveSelectedLegends ({ commit, state }, payload) {
    // Only change the data if they require it
    if (!isEqual(state.selectedLegends, payload)) {
      commit('setSelectedLegends', payload)
      SocketActions.serverWrite(Globals.MOONRAKER_DB.ROOTS.charts.name + '.selectedLegends', payload)
    }
  }
}
