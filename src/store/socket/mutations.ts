import Vue from 'vue'
import { MutationTree } from 'vuex'
import { get } from 'lodash-es'
import { SocketState, ChartData, Macro, ConsoleEntry } from './types'
import { defaultState } from './index'
import { Globals } from '@/globals'

export const mutations: MutationTree<SocketState> = {
  resetState (state, fullReset: boolean) {
    const newState = defaultState()
    const keysToAvoid = ['open', 'connecting', 'plugins', 'macros']
    Object.keys(newState).forEach((key: string) => {
      // Some properties we may not want to reset.
      // Macros and plugins we don't clear in order to
      // ensure a user can still turn off / on a printer
      // for example even when klippy may be disconnected.
      if (
        !keysToAvoid.includes(key) ||
        fullReset
      ) {
        Vue.set(state, key, newState[key])
      }
    })
  },
  onSocketOpen (state) {
    state.open = true
  },
  onSocketClose (state) {
    state.open = false
  },
  onSocketConnecting (state, payload) {
    state.connecting = payload
  },
  onSocketReadyState (state, payload) {
    state.ready = payload
  },
  onAcceptNotifications (state) {
    state.acceptingNotifications = true
  },
  onQueryEndstops (state, payload) {
    state.endstops = payload
  },
  onPrinterBusy (state, payload: boolean) {
    state.printer.busy = payload
  },
  onSocketNotify (state, payload) {
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
  },
  onPrinterInfo (state, payload) {
    Vue.set(state.printer, 'info', payload)
  },
  onPlugins (state, payload) {
    Vue.set(
      state,
      'plugins',
      [...new Set([...state.plugins, ...payload])]
    )
  },
  onFailedPlugins (state, payload) {
    Vue.set(
      state,
      'failed_plugins',
      [...new Set([...state.failed_plugins, ...payload])]
    )
  },
  onPrinterObjectsList (state, payload) {
    if (!state.printer.objects.includes(payload)) {
      state.printer.objects.push(payload)
    }
  },
  addConsoleEntry (state, entry: ConsoleEntry) {
    if (entry.id === undefined) {
      state.consoleEntryCount++
      entry.id = state.consoleEntryCount
    }
    while (state.console.length >= Globals.CONSOLE_HISTORY_RETENTION) {
      state.console.shift()
    }
    state.console.push(entry)
  },
  setMacros (state, macros: Macro[]) {
    Vue.set(state, 'macros', macros)
  },
  updateMacro (state, macro: Macro) {
    const i = state.macros.findIndex(m => m.name === macro.name)
    Vue.set(state.macros, i, macro)
  },
  clearEndStops (state) {
    state.endstops = {}
  },
  addInitialChartData (state, payload) {
    payload.forEach((item: ChartData) => {
      state.chart.push(item)
    })
  },
  addChartStore (state, payload: ChartData[]) {
    state.chart = payload
  },
  addChartEntry (state, payload: { retention: number; data: ChartData }) {
    // Dont keep data older than our set retention
    state.chart.push(payload.data)
    while (state.chart.length > payload.retention) {
      state.chart.splice(0, 1)
    }
  },
  resetCurrentFile (state) {
    const newState = defaultState().printer.current_file
    Vue.set(state.printer, 'current_file', newState)
  },
  setGcodeHelp (state, payload) {
    Vue.set(state, 'availableCommands', payload)
  }
}
