import Vue from 'vue'
import type { MutationTree } from 'vuex'
import type { PrinterState } from './types'
import { defaultState } from './state'
import { get } from 'lodash-es'

export const mutations: MutationTree<PrinterState> = {
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

  setPrinterInfo (state, payload) {
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

  setSocketNotify (state, payload) {
    if (typeof payload.payload === 'object') {
      const o = get(state.printer, payload.key)
      if (o === undefined) {
        // Object is not set yet, so create it.
        Vue.set(state.printer, payload.key, payload.payload)
      } else {
        Object.keys(payload.payload).forEach((p) => {
          // Leaving the if here, although it should
          // always evaluate true since we never
          // get an update unless something has changed.
          if (
            o[p] !== payload.payload[p]
          ) {
            Vue.set(state.printer[payload.key], p, payload.payload[p])
          }
        })
      }
    } else {
      // I don't think this'd get called.
      if (get(state.printer, payload.key) !== payload.payload) {
        Vue.set(state.printer, payload.key, payload.payload)
      }
    }
  }

}
