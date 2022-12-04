import Vue from 'vue'
import { MutationTree } from 'vuex'
import { PrinterState } from './types'
import { defaultState } from './state'
import consola from 'consola'
import { get } from 'lodash-es'

export const mutations: MutationTree<PrinterState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setPrinterInfo (state, payload) {
    Vue.set(state.printer, 'info', payload)
  },

  setQueryEndstops (state, payload) {
    state.printer.endstops = payload
  },

  setPrinterBusy (state, payload: boolean) {
    state.printer.busy = payload
  },

  setPrinterObjectList (state, payload) {
    if (!state.printer.objects.includes(payload)) {
      state.printer.objects.push(payload)
    }
  },

  setClearEndStops (state) {
    state.printer.endstops = {}
  },

  setResetCurrentFile (state) {
    const newState = defaultState().printer.current_file
    consola.debug('resetting current file', newState)
    Vue.set(state.printer, 'current_file', newState)
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
