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
    state.info = Object.freeze(payload)
  },

  setClearEndStops (state) {
    const queryEndstops = state.printer.query_endstops

    if (queryEndstops == null) {
      return
    }

    queryEndstops.last_query = Object.freeze({})
  },

  setClearScrewsTiltAdjust (state) {
    const screwsTiltAdjust = state.printer.screws_tilt_adjust

    if (screwsTiltAdjust == null) {
      return
    }

    screwsTiltAdjust.error = false
    screwsTiltAdjust.max_deviation = null
    screwsTiltAdjust.results = Object.freeze({})
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
      if (stateObject[key] !== payloadValue[key]) {
        Vue.set(stateObject, key, Object.freeze(payloadValue[key]))
      }
    }
  }
} satisfies MutationTree<PrinterState>
