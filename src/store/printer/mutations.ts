import Vue from 'vue'
import type { MutationTree } from 'vuex'
import type { PrinterState } from './types'
import { defaultState } from './state'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setManualProbeDialogOpen (state, payload: boolean) {
    state.manualProbeDialogOpen = payload
  },

  setBedScrewsAdjustDialogOpen (state, payload: boolean) {
    state.bedScrewsAdjustDialogOpen = payload
  },

  setScrewsTiltAdjustDialogOpen (state, payload: boolean) {
    state.screwsTiltAdjustDialogOpen = payload
  },

  setForceMoveEnabled (state, payload: boolean) {
    state.forceMoveEnabled = payload
  },

  setPrinterInfo (state, payload: Moonraker.KlippyApis.Info) {
    state.info = payload
  },

  setPrinterObjectList (state, payload) {
    if (!state.printer.objects.includes(payload)) {
      state.printer.objects.push(payload)
    }
  },

  setClearEndStops (state) {
    if (state.printer.query_endstops == null) {
      return
    }

    state.printer.query_endstops = {
      ...state.printer.query_endstops,
      last_query: {}
    }
  },

  setClearScrewsTiltAdjust (state) {
    if (state.printer.screws_tilt_adjust == null) {
      return
    }

    state.printer.screws_tilt_adjust = {
      ...state.printer.screws_tilt_adjust,
      error: false,
      max_deviation: null,
      results: {}
    }
  },

  setSocketNotify<T extends keyof Klipper.PrinterState> (state: PrinterState, payload: { key: T, payload: Klipper.PrinterState[T] }) {
    const { key: payloadKey, payload: payloadValue } = payload

    let stateObject = state.printer[payloadKey]

    if (stateObject == null) {
      // Object is not set yet, so create it.
      stateObject = {}
      Vue.set(state.printer, payloadKey, stateObject)
    }
    for (const key in payloadValue) {
      // Leaving the if here, although it should
      // always evaluate true since we never
      // get an update unless something has changed.
      if (stateObject[key] !== payloadValue[key]) {
        Vue.set(stateObject, key, Object.freeze(payloadValue[key]))
      }
    }
  }
} satisfies MutationTree<PrinterState>
