import { GetterTree } from 'vuex'
import { ChartState } from './types'
import { RootState } from '../types'
import { Globals } from '@/globals'

export const getters: GetterTree<ChartState, RootState> = {
  /**
   * Returns our actual chart data
   */
  getChartData: (state) => {
    return state.chart
  },

  /**
   * Returns currently selected legends
   */
  getSelectedLegends: (state) => {
    return state.selectedLegends
  },

  /**
   * Return the charts retention.
   */
  getChartRetention: (state, getters, rootState, rootGetters) => {
    const config = rootGetters['server/getConfig']
    return (
      'server' in config &&
      'temperature_store_size' in config.server
    )
      ? config.server.temperature_store_size
      : Globals.CHART_HISTORY_RETENTION
  }
}
