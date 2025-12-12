import type { ActionTree } from 'vuex'
import type { KlippyApp, PrinterState } from './types'
import type { RootState } from '../types'
import { handlePrintStateChange, handleCurrentFileChange, handleTrinamicDriversChange } from '../helpers'
import { handleAddChartEntry, handleSystemStatsChange, handleMcuStatsChange } from '../chart_helpers'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'
import { consola } from 'consola'
import type { DiagnosticsCardContainer } from '@/store/diagnostics/types'
import sandboxedEval from '@/plugins/sandboxedEval'
import { gte, valid } from 'semver'
import i18n from '@/plugins/i18n'

const evalCollectors = async (printer: Klipper.PrinterState, collectors: string[]): Promise<Record<string, unknown>> => {
  try {
    const data = await sandboxedEval<Record<string, unknown>>(`
    const printer = ${JSON.stringify(printer)}
    const collectors = ${JSON.stringify(collectors)}
    const result = {}

    for (const collector of collectors) {
      try {
        result[collector] = eval(collector)
      } catch (e) {
        result[collector] = String(e || 'Unknown Error')
      }
    }

    return result
  `, 'metrics')

    return data
  } catch (e) {
    const error = String(e || 'Unknown Error')

    return Object.fromEntries(
      collectors
        .map(collector => [collector, error])
    )
  }
}

export const actions = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async manualProbeDialogOpen ({ commit }, payload: boolean) {
    commit('setManualProbeDialogOpen', payload)
  },

  async bedScrewsAdjustDialogOpen ({ commit }, payload: boolean) {
    commit('setBedScrewsAdjustDialogOpen', payload)
  },

  async screwsTiltAdjustDialogOpen ({ commit }, payload: boolean) {
    commit('setScrewsTiltAdjustDialogOpen', payload)
  },

  async forceMoveEnabled ({ commit }, payload: boolean) {
    commit('setForceMoveEnabled', payload)
  },

  async checkKlipperMinVersion ({ state, getters, dispatch }) {
    const klipperVersion = state.info?.software_version ?? '?'

    const fullKlipperVersion = klipperVersion.includes('-')
      ? klipperVersion
      : `${klipperVersion}-0`

    const klippyApp: KlippyApp = getters['getKlippyApp']

    if (
      valid(klipperVersion) &&
      valid(klippyApp.minVersion) &&
      !gte(fullKlipperVersion, klippyApp.minVersion)
    ) {
      dispatch('notifications/pushNotification', {
        id: `old-klipper-${klipperVersion}`,
        title: 'Klipper',
        description: i18n.t('app.version.label.old_component_version', { name: 'Klipper', version: klippyApp.minVersion }),
        to: '/settings#versions',
        btnText: i18n.t('app.version.btn.view_versions'),
        type: 'warning',
        merge: true
      }, { root: true })
    }
  },

  /**
   * Printer Info
   */
  async onPrinterInfo ({ commit, dispatch }, payload: Moonraker.KlippyApis.Info) {
    commit('setPrinterInfo', payload)

    dispatch('checkKlipperMinVersion')
  },

  /**
   * Query endstops
   */
  async onQueryEndstops ({ commit }, payload: Moonraker.KlippyApis.QueryEndstopsStatusResponse) {
    // printer.query_endstops state is not updating, so we use the response here to do it manually

    const queryEndstops: Klipper.QueryEndstopsState = {
      last_query: {}
    }

    for (const key in payload) {
      queryEndstops.last_query[key] = +(payload[key] === 'TRIGGERED')
    }

    commit('setSocketNotify', { key: 'query_endstops', payload: queryEndstops })
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
  async onPrinterObjectsList ({ commit }, payload: Moonraker.KlippyApis.ObjectsListResponse) {
    // Given our object list, subscribe to any data we'd want constant updates for
    // and prepopulate our store.
    const subscriptions: Record<string, null> = {}

    for (const key in payload.objects) {
      if (!key.includes('menu')) {
        subscriptions[key] = null
      }

      commit('setPrinterObjectList', key.replace(' ', '.'))
    }

    SocketActions.printerObjectsSubscribe(subscriptions)
  },

  async onPrinterObjectsSubscribe ({ commit, dispatch }, payload: { status: Klipper.PrinterState }) {
    // Initial printer status
    const status = payload.status

    if (status.screws_tilt_adjust != null) {
      status.screws_tilt_adjust = {
        ...status.screws_tilt_adjust,
        error: false,
        max_deviation: null,
        results: {}
      }
    }

    if (status.query_endstops != null) {
      status.query_endstops = {
        ...status.query_endstops,
        last_query: {}
      }
    }

    if (status.toolhead != null) {
      if (status.toolhead.max_accel_to_decel != null) {
        status.toolhead.minimum_cruise_ratio = null
      } else {
        status.toolhead.max_accel_to_decel = null
      }
    }

    // Accept notifications, and commit the first subscribe.
    commit('socket/setAcceptNotifications', true, { root: true })
    await dispatch('onNotifyStatusUpdate', status)

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
  async onNotifyStatusUpdate ({ rootState, commit, getters, dispatch }, payload: Partial<Klipper.PrinterState>) {
    // TODO: We potentially get many updates here.
    // Consider caching the updates and sending them every <interval>.
    // We don't want to miss an update - but also don't need all of them
    // so quickly.

    // Do NOT accept notification updates until our subscribe comes back.
    // This is because moonraker currently sends notification updates
    // prior to subscribing on browser refresh.
    if (payload && rootState.socket.acceptingNotifications) {
      // Detect a printing state change.
      // We do this prior to commiting the notify so we can
      // compare the before and after.
      handleCurrentFileChange(payload, rootState)
      handlePrintStateChange(payload, rootState, dispatch)
      handleSystemStatsChange(payload, rootState, commit)
      handleMcuStatsChange(payload, rootState, commit)
      handleTrinamicDriversChange(payload, rootState, dispatch, getters)

      for (const key in payload) {
        const val = payload[key]
        // Commit the value.
        commit('setSocketNotify', { key, payload: val })
      }

      // Add a temp chart entry
      const rootStateServerConfig = rootState.server.config
      const retention =
        rootStateServerConfig?.data_store?.temperature_store_size ??
        rootStateServerConfig?.server?.temperature_store_size ??
        Globals.CHART_HISTORY_RETENTION
      handleAddChartEntry(retention, rootState, commit, getters)
      dispatch('onDiagnosticsMetricsUpdate')
    }
  },

  async onFastNotifyStatusUpdate ({ rootState, commit, dispatch }, payload) {
    // Do NOT accept updates until our subscribe comes back.
    // This is because moonraker currently sends notification updates
    // prior to subscribing on browser refresh.
    if (payload && rootState.socket.acceptingNotifications) {
      commit('setSocketNotify', payload)
      dispatch('onDiagnosticsMetricsUpdate')
    }
  },

  async onDiagnosticsMetricsUpdate ({ state, rootState, commit, rootGetters }) {
    if (!rootState.config.uiSettings.general.enableDiagnostics) {
      return
    }

    const layout = rootState.layout.layouts.diagnostics as DiagnosticsCardContainer

    const metrics = Object.values(layout)
      .flat()
      .flatMap(card => card.axes)
      .filter(axis => axis.enabled)
      .flatMap(axis => axis.metrics)

    const collectors = [...new Set(metrics.map(metric => metric.collector))]

    const data = await evalCollectors(state.printer, collectors)

    data.date = new Date()

    commit('charts/setChartEntry', {
      type: 'diagnostics',
      retention: rootGetters['charts/getChartRetention'],
      data
    }, { root: true })
  }
} satisfies ActionTree<PrinterState, RootState>
