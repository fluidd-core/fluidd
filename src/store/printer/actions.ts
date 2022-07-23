import { ActionTree } from 'vuex'
import { PrinterState } from './types'
import { RootState } from '../types'
import { handlePrintStateChange, handleCurrentFileChange, handleExcludeObjectChange } from '../helpers'
import { handleAddChartEntry, handleSystemStatsChange, handleMcuStatsChange } from '../chart_helpers'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'
import consola from 'consola'

// let retryTimeout: number

export const actions: ActionTree<PrinterState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Printer Info
   */
  async onPrinterInfo ({ commit }, payload) {
    commit('setPrinterInfo', payload)
  },

  /**
   * Query endstops
   */
  async onQueryEndstops ({ commit }, payload) {
    commit('setQueryEndstops', payload)
  },

  /**
   * Print cancelled confirmation.
   * Fires as a part of a socket action.
   */
  async onPrintCancel () {
    consola.debug('Print Cancelled')
  },

  /**
   * Print paused confirmation.
   * Fires as a part of a socket action.
   */
  async onPrintPause () {
    consola.debug('Print Paused')
  },

  /**
   * Print resumed confirmation.
   * Fires as a part of a socket action.
   */
  async onPrintResume () {
    consola.debug('Print Resumed')
  },

  /**
   * Print start confirmation.
   * Fires as a watch on a printer state change.
   */
  async onPrintStart (_, payload) {
    consola.debug('Print start detected', payload)
  },

  /**
   * Print end confirmation.
   * Fires as a watch on a printer state change.
   */
  async onPrintEnd (_, payload) {
    consola.debug('Print end detected', payload)
  },

  /**
   * ==========================================================================
   *  Non specific socket requests
   * ==========================================================================
   */

  /**
   * Stores the printers object list.
   */
  async onPrinterObjectsList ({ commit }, payload) {
    // Given our object list, subscribe to any data we'd want constant updates for
    // and prepopulate our store.
    let intendedSubscriptions = {}
    payload.objects.forEach((k: string) => {
      if (!k.includes('menu') && !k.includes('gcode_macro')) {
        intendedSubscriptions = { ...intendedSubscriptions, [k]: null }
      }
      let key = k
      if (k.includes(' ')) key = key.replace(' ', '.')
      commit('printer/setPrinterObjectList', key, { root: true })
    })

    SocketActions.printerObjectsSubscribe(intendedSubscriptions)
  },

  async onPrinterObjectsSubscribe ({ commit, dispatch }, payload) {
    // Accept notifications, and commit the first subscribe.
    commit('socket/setAcceptNotifications', true, { root: true })
    await dispatch('onNotifyStatusUpdate', payload.status)

    SocketActions.serverGcodeStore()
    SocketActions.printerGcodeHelp()
    SocketActions.serverTemperatureStore()
  },

  /**
   * ==========================================================================
   * Automated notifications via socket
   * Note that klipper will send an update every 250ms, if the data CHANGED.
   * This applies per object subscribed - which can add up.
   * ==========================================================================
   */

  /** Automated notify events via socket */
  async onNotifyStatusUpdate ({ rootState, commit, getters, dispatch }, payload) {
    // TODO: We potentially get many updates here.
    // Consider caching the updates and sending them every <interval>.
    // We don't want to miss an update - but also don't need all of them
    // so quickly.

    // Do NOT accept notification updates until our subscribe comes back.
    // This is because moonraker currently sends notification updates
    // prior to subscribing on browser refresh.
    if (payload && rootState.socket?.acceptingNotifications) {
      // Detect a printing state change.
      // We do this prior to commiting the notify so we can
      // compare the before and after.
      handleCurrentFileChange(payload)
      handlePrintStateChange(payload, rootState, dispatch)
      handleExcludeObjectChange(payload, rootState, dispatch)
      handleSystemStatsChange(payload)
      handleMcuStatsChange(payload)

      for (const key in payload) {
        const val = payload[key]
        // Skip anything we need here.
        if (
          !key.includes('gcode_macro')
        ) {
          // Commit the value.
          commit('printer/setSocketNotify', { key, payload: val }, { root: true })
        }
      }

      // Add a temp chart entry
      const rootStateServerConfig = rootState.server?.config
      const retention =
        rootStateServerConfig?.data_store?.temperature_store_size ??
        rootStateServerConfig?.server?.temperature_store_size ??
        Globals.CHART_HISTORY_RETENTION
      handleAddChartEntry(retention, getters.getChartableSensors)
      dispatch('onDiagnosticsDataUpdate')
    }
  },

  async onFastNotifyStatusUpdate ({ rootState, commit, dispatch }, payload) {
    // Do NOT accept updates until our subscribe comes back.
    // This is because moonraker currently sends notification updates
    // prior to subscribing on browser refresh.
    if (payload && rootState.socket?.acceptingNotifications) {
      commit('printer/setSocketNotify', payload, { root: true })
      dispatch('onDiagnosticsDataUpdate')
    }
  },

  async onDiagnosticsDataUpdate ({ commit, state, rootGetters, rootState }) {
    if (!rootState.config?.uiSettings.general.enableDiagnostics) return

    const extrusionSpeed = state.printer.motion_report.live_extruder_velocity
    const filamentDiameter = this.getters['printer/getPrinterSettings']('extruder.filament_diameter') || 1.75
    const filamentArea = (filamentDiameter / 2) ** 2 * Math.PI
    const flow = filamentArea * extrusionSpeed

    const velocity = state.printer.motion_report.live_velocity

    const data = { extrusion_rate: flow, velocity }

    for (const [type, value] of Object.entries(data)) {
      commit('charts/setChartEntry', {
        type,
        retention: rootGetters['charts/getChartRetention'],
        data: {
          date: new Date(),
          [type]: Math.round(value * 1000) / 1000
        }
      }, { root: true })
    }
  }
}
