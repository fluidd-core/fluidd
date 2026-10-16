import type { ActionTree } from 'vuex'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'
import type { ChartState } from './types'
import { retainedSamples } from '@/services/overview/timeline'
import type { RootState } from '../types'
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
    const response = payload?.requestContext ? payload.payload : payload
    const context = payload?.requestContext as { apiUrl?: string; connectionId?: string | null } | undefined
    if (context && (context.apiUrl !== rootState.config.apiUrl || context.connectionId !== rootState.socket.connectionId)) return
    // Moonraker supplies ordered one-second arrays, not absolute timestamps.
    // Anchor approximately at receipt; never pad a short history with readings.
    const sensors = Object.fromEntries(Object.entries(response ?? {}).filter(([key]) => !!rootState.printer.printer[key]))
    commit('setChartStore', retainedSamples(sensors as Record<string, Record<string, unknown[]>>, Date.now(), rootGetters['charts/getChartRetention']))
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
      SocketActions.serverWrite(Globals.MOONRAKER_DB.fluidd.ROOTS.charts.name + '.selectedLegends', payload)
    }
  }
}
