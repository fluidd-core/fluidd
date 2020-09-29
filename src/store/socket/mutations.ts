import Vue from 'vue'
import { MutationTree } from 'vuex'
import { get } from 'lodash-es'
import { SocketState, ChartItem, Macro } from './types'
import { state as originalState, state } from './index'
import { chartConfiguration } from '@/globals'

export const mutations: MutationTree<SocketState> = {
  resetState (state) {
    Vue.set(state, 'printer', originalState.printer)
  },
  setFansProbes (state, payload) {
    if (
      payload
    ) {
      Object.keys(payload).forEach((item) => {
        Vue.set(state, item, payload[item])
      })
    }
  },
  onSocketOpen (state) {
    state.open = true
  },
  onSocketClose (state) {
    state.open = false
  },
  // onSocketError (state, payload: SocketError) {
  //   state.error = payload
  // },
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
          if (
            o[p] !== payload.payload[p]
          ) {
            Vue.set(state.printer[payload.key], p, payload.payload[p])
          } else {
            // never getting here...
            // i think because updates are only sending changed values.
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
    state.printer.info = payload
  },
  onPrinterObjectsList (state, payload) {
    if (!state.printer.objects.includes(payload)) {
      state.printer.objects.push(payload)
    }
  },
  addConsoleEntry (state, payload) {
    state.console.unshift(payload)
  },
  removeConsoleFirstEntry () {
    state.console.shift()
  },
  addMacro (state, macro: Macro) {
    Vue.set(state.macros, macro.name, macro)
  },
  updateMacro (state, macro: Macro) {
    state.macros[macro.name] = macro
  },
  addWait (state, payload) {
    state.waits.push(payload)
  },
  removeWait (state, payload) {
    if (state.waits.length) {
      state.waits.splice(state.waits.indexOf(payload, 0), 1)
    }
  },
  addInitialChartData (state, payload) {
    payload.forEach((item: ChartItem) => {
      state.chart.push(item)
    })
  },
  addChartValue (state, payload) {
    // Sensor is assumed added by the initial chart data.
    const chartItem = state.chart.find(item => item.label === payload.label)
    // Dont keep data older than 10 minutes...
    if (chartItem) {
      // Only add if it's at least a second over the prior entry.
      const date1 = new Date(payload.x)
      const date2 = new Date(chartItem.data[chartItem.data.length - 1].x)
      const diff1 = 1000 // time to wait before adding another entry.
      const diff2 = chartConfiguration.HISTORY_RETENTION * 60 * 1000 // Truncate items older than this.
      if (date1.getTime() - date2.getTime() > diff1) {
        chartItem.data.push({ x: payload.x, y: payload.y })
        let i
        while (
          (i = chartItem.data.findIndex(item => date1.getTime() - new Date(item.x).getTime() > diff2)) > -1
        ) {
          chartItem.data.splice(i, 1)
        }
      }
    }
  }
}
