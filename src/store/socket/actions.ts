import Vue from 'vue'
import { ActionTree } from 'vuex'
import { SocketState, ChartDataSet } from './types'
import { RootState } from '../types'
import { configureChartEntry } from '../helpers'
import { Globals } from '@/globals'
import { SocketActions } from '@/socketActions'
import EventBus from '@/eventBus'

export const actions: ActionTree<SocketState, RootState> = {
  /**
   * ==========================================================================
   *  Specific requests via socket
   * ==========================================================================
   */

  /**
    * Fired when the socket opens.
    */
  async onSocketOpen ({ commit }, payload) {
    commit('onSocketOpen', payload)
    SocketActions.printerInfo()
  },

  /**
   * Fired when the socket closes.
   */
  async onSocketClose ({ commit }, payload) {
    commit('resetState')
    commit('onSocketClose', payload)
  },

  /**
   * Fired when the socket encounters an error.
   * We might see an error under code 400 for invalid circumstances, like
   * trying to extrude under temp. Should present the user with an error
   * for these cases.
   * Another case might be during a klippy disconnect.
   */
  async onSocketError ({ commit }, payload) {
    if (payload.code === 400) {
      // clear any associated waits.
      if (payload.__request__ && payload.__request__.wait) {
        commit('removeWait', payload.__request__.wait)
      }

      // If our message contains json, we should try to parse it.
      // This is pretty bad, should get moonraker to fix this response.
      let message = ''
      try {
        message = JSON.parse(payload.message.replace(/'/g, '"')).message
      } catch (e) {
        message = payload.message
      }

      EventBus.$emit('flashMessage', { type: 'error', timeout: -1, text: message })
    }
    if (payload.code === 503) {
      //  && payload.message.toLowerCase() === 'klippy host not connected'
      // This indicates klippy is non-responsive, or there's a configuration error
      // in klipper. We should retry after the set delay.
      // Restart our startup sequence.
      commit('resetState')
      commit('onPrinterInfo', { state: 'error', message: payload.message }) // Forcefully set the printer in error
      setTimeout(() => {
        SocketActions.printerInfo()
      }, Globals.KLIPPY_RETRY_DELAY)
    }
  },

  async onQueryEndstops ({ commit }, payload) {
    commit('onQueryEndstops', payload)
  },

  /**
   * Print cancelled confirmation.
   */
  async onPrintCancel () {
    console.debug('Print Cancelled')
  },

  /**
   * Print paused confirmation.
   */
  async onPrintPause () {
    console.debug('Print Paused')
  },

  async onPrintResume () {
    console.debug('Print Resumed')
  },

  async onPrinterInfo ({ commit }, payload) {
    commit('onPrinterInfo', payload)

    if (payload.state !== 'ready') {
      setTimeout(() => {
        SocketActions.printerInfo()
      }, Globals.KLIPPY_RETRY_DELAY)
    } else {
      // We're good, move on. Start by loading the temperature history.
      SocketActions.serverTemperatureStore()
    }
  },

  /**
   * Once a gcode script has run, the
   * socket notifies us of the result of
   * the specific request here.
   */
  async onGcodeScript ({ commit, dispatch }, payload) {
    // If the response is ok, pass it to the console.
    if (payload && payload.result && payload.result === 'ok') {
      dispatch('addConsoleEntry', 'Recv: Ok')
    }
    // Remove a wait if defined.
    if (payload.__request__ && payload.__request__.wait && payload.__request__.wait.length) {
      commit('removeWait', payload.__request__.wait)
    }
  },

  /**
   * Stores the printers object list.
   */
  async onPrinterObjectsList ({ commit, dispatch }, payload) {
    // Given our object list, subscribe to any data we'd want constant updates for
    // and prepopulate our store.
    let intendedSubscriptions = {}
    payload.objects.forEach((k: string) => {
      if (!k.includes('menu') && !k.includes('gcode_macro')) {
        intendedSubscriptions = { ...intendedSubscriptions, [k]: null }
      }
      let key = k
      if (k.includes(' ')) key = key.replace(' ', '.')
      if (k.includes('gcode_macro')) {
        dispatch('addMacro', k.split(' ')[1])
      } else {
        commit('onPrinterObjectsList', key)
      }
    })
    SocketActions.printerObjectsSubscribe(intendedSubscriptions)
  },

  /**
   * Loads stored server data for the past 20 minutes.
   */
  async onTemperatureStore ({ commit }, payload) {
    const now = new Date() // Set a base time to work out the temp data from.
    // On a fresh boot of the host system, moonraker should give us enough data;
    // however, it seems sometimes it does not. So - we should pad this out when
    // we need to.
    // Otherwise, for a system that has been running for a bit - we should expect
    // enough data from moonraker to start with.

    // how many datasets to add. Moonraker should give us 20 minutes, in 1 second intervals.. but we only need 10 minutes.
    const count = 600 // The size of the dataset we need.
    const moonrakerCount = 1200 // The size of the dataset we expect moonraker to provide.

    for (const originalKey in payload) { // each heater / temp fan
      // If the dataset is less than 1200, then pad the beginning
      // until we get to our intended count
      const l = payload[originalKey].temperatures.length
      if (l < moonrakerCount) {
        const pad = moonrakerCount - l
        const lastTemp = payload[originalKey].temperatures[0]
        payload[originalKey].temperatures = [...Array.from({ length: pad }, () => lastTemp), ...payload[originalKey].temperatures]
        payload[originalKey].targets = [...Array.from({ length: pad }, () => 0), ...payload[originalKey].targets]
      }

      const val = payload[originalKey]
      let key = originalKey
      if (originalKey.includes(' ')) {
        key = key.split(' ')[1]
      }
      const data: ChartDataSet[] = [
        { label: key, data: [], radius: 0 },
        { label: `${key}Target`, data: [], radius: 0 }
      ]
      for (let i = count; i < val.temperatures.length - 1; i++) {
        // 1000 * (1200 - 1199) - 1000
        const date = new Date(now.getTime() - (1000 * (val.temperatures.length - i)) - 1000)
        data[0].data.push({
          x: date,
          y: val.temperatures[i]
        })
        data[1].data.push({
          x: date,
          y: val.targets[i]
        })
      }
      commit('addInitialChartData', data)
    }

    // After we've loaded the initial temp data, load and subscribe to the rest.
    SocketActions.printerObjectsList()
  },

  async onPrinterObjectsSubscribe ({ commit, dispatch }, payload) {
    // This initial subscribe also gives us all of our temperature fans, probes etc..
    // so we can populate a list of these things, without having to re-iterate the
    // whole printer object later.
    const keys = [
      'temperature_fan',
      'temperature_probe',
      'temperature_sensor',
      'heater_fan',
      'filament_switch_sensor',
      'output_pin'
    ]
    const r: {[key: string]: string[]} = {}

    Object.keys(payload.status).forEach((p) => {
      const key = p.split(' ')
      if (
        p.includes(' ') &&
        keys.includes(key[0])
      ) {
        const rootKey = key[0] + 's'
        if (rootKey in r === false) {
          r[rootKey] = [key[1]]
        } else {
          r[rootKey].push(key[1])
        }
      }
    })
    commit('setFansProbes', r)
    dispatch('notifyStatusUpdate', payload.status)
  },

  async onServerFilesMetadata ({ commit }, payload) {
    commit('onSocketNotify', { key: 'current_file', payload })
  },

  /**
   * ==========================================================================
   * Automated notifications via socket
   * Note that klipper will send an update every 250ms, if the data CHANGED.
   * This applies per object subscribed - which can add up.
   * ==========================================================================
   */

  /** Automated notify events via socket */
  async notifyStatusUpdate ({ state, commit }, payload) {
    // TODO: We potentially get many updates here.
    // Consider caching the updates and sending them every <interval>.
    // We don't want to miss an update - but also don't need all of them
    // so quickly.

    // Take payload, put it in buffer object.
    // add setTimeout to empty the buffer and run the below..

    if (payload) {
      for (const key in payload) {
        const val = payload[key]
        // Skip anything we need here.
        if (
          !key.includes('gcode_macro')
        ) {
          // First, commit the value.
          commit('onSocketNotify', { key, payload: val })

          // Now pick out certain updates if required...

          // If this is a sensor update, record it for graphing.
          // A list of key strings to check for.
          let keys = [
            'temperature_fan',
            'temperature_probe'
          ]
          if (state.printer.heaters.available_heaters.length > 0) {
            keys = [...keys, ...state.printer.heaters.available_heaters]
          }
          if (
            keys.some(e => key.startsWith(e)) && // Found a node with a possible temp val...
            ('temperature' in val || 'target' in val) // Ensures the node has a temp or target val...
          ) {
            const r = configureChartEntry(key, val, state)
            commit('addChartValue', r.temperature)
            commit('addChartValue', r.target)
          }
        }
      }
    }
  },

  /**
   * Any gcode related responses are notified to us here,
   * irrelevant on if this was a specific request or not.
   */
  async notifyGcodeResponse ({ dispatch }, payload) {
    // stream gcode responses to our console data, ensuring
    // we truncate to max line count.
    dispatch('addConsoleEntry', `Recv: ${payload}`)
  },
  async notifyKlippyDisconnected ({ commit }) {
    commit('resetState')
    commit('onPrinterInfo', { state: 'error' }) // Forcefully set the printer in error
  },
  async notifyFilelistChanged ({ dispatch }, payload) {
    dispatch('files/notify' + Vue.$filters.capitalize(payload.action), payload, { root: true }) // Passed on to the files module
  },
  async notifyMetadataUpdate (_, payload) {
    console.debug('metadataUpdate', payload)
  },

  /**
   * ==========================================================================
   *  Non specific socket requests
   * ==========================================================================
   */

  /** Not socket related */
  async addWait ({ commit }, wait) {
    commit('addWait', wait)
  },
  async removeWait ({ commit }, wait) {
    commit('removeWait', wait)
  },
  async addConsoleEntry ({ commit, state }, payload) {
    if (state.console.length >= Globals.CONSOLE_HISTORY_RETENTION) {
      commit('removeConsoleFirstEntry')
    }
    commit('addConsoleEntry', payload.replace(/(?:\r\n|\r|\n)/g, '<br>'))
  },
  async addMacro ({ commit, rootState }, macro) {
    // Macros should include a property to indicate if they're visible
    // on the dashboard or not. This comes from the fileConfig.
    const hidden = rootState.config?.fileConfig?.dashboard?.hiddenMacros.includes(macro)
    commit('addMacro', { name: macro, visible: !hidden })
  },
  async updateMacro ({ commit }, macro) {
    commit('updateMacro', macro)
  }
}
