import Vue from 'vue'
import { ActionTree } from 'vuex'
import { SocketState, ConsoleEntry, ChartData, Macro } from './types'
import { RootState } from '../types'
import { configureChartEntry } from '../helpers'
import { Globals } from '@/globals'
import { SocketActions } from '@/socketActions'
import EventBus from '@/eventBus'

let retryTimeout: number

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
    // SocketActions.serverInfo()
  },

  /**
   * Fired when the socket closes.
   */
  async onSocketClose ({ commit }, payload) {
    commit('resetState', true)
    commit('onSocketClose', payload)
  },

  /**
   * Sets state based on if we're attempting to reconnect
   * the socket or not. If we are not, then the user
   * can invoke a forced refresh.
   */
  async onSocketConnecting ({ commit }, payload) {
    commit('onSocketConnecting', payload)
  },

  /**
   * Fired when the socket encounters an error.
   * We might see an error under code 400 for invalid circumstances, like
   * trying to extrude under temp. Should present the user with an error
   * for these cases.
   * Another case might be during a klippy disconnect.
   */
  async onSocketError ({ commit }, payload) {
    if (payload.code >= 400 && payload.code < 500) {
      // If our message contains json, we should try to parse it.
      // This is pretty bad, should get moonraker to fix this response.
      let message = ''
      try {
        message = JSON.parse(payload.message.replace(/'/g, '"')).message
      } catch (e) {
        message = payload.message
      }

      EventBus.$emit('flashMessage', { type: 'error', text: message })
    }
    if (payload.code === 503) {
      // This indicates klippy is non-responsive, or there's a configuration error
      // in klipper. We should retry after the set delay.
      // Restart our startup sequence.
      commit('resetState', false)
      commit('onPrinterInfo', { state: 'error', state_message: payload.message }) // Forcefully set the printer in error
      clearTimeout(retryTimeout)
      retryTimeout = setTimeout(() => {
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
      clearTimeout(retryTimeout)
      retryTimeout = setTimeout(() => {
        SocketActions.printerInfo()
      }, Globals.KLIPPY_RETRY_DELAY)
    } else {
      // We're good, move on. Start by loading the server data, temperature and console history.
      SocketActions.serverInfo()
      SocketActions.serverConfig()
      SocketActions.serverGcodeStore()
      SocketActions.printerGcodeHelp()
    }
  },

  /**
   * Gives us moonrakers configuration.
   */
  async onServerConfig ({ commit }, payload) {
    if (payload.config) {
      commit('config/onServerConfig', payload.config, { root: true })
    }
    SocketActions.serverTemperatureStore()
  },

  async onServerInfo ({ commit, dispatch }, payload) {
    // This payload should return a list of enabled plugins
    // and root directories that are available.
    if (
      payload.failed_plugins &&
      payload.failed_plugins.length
    ) {
      commit('onFailedPlugins', payload.failed_plugins)
    }

    if (
      payload.plugins &&
      payload.plugins.length > 0
    ) {
      commit('onPlugins', payload.plugins)

      // Init any plugins we need.
      const pluginsToInit = [
        'power',
        'update_manager'
      ]
      pluginsToInit.forEach((plugin) => {
        if (payload.plugins.includes(plugin)) {
          switch (plugin) {
            case 'power':
              SocketActions.machineDevicePowerDevices()
              break
            case 'update_manager':
              SocketActions.machineUpdateStatus()
              break
          }
        }
      })
    }

    if (payload.registered_directories) {
      dispatch('files/onRegisteredDirectores', payload.registered_directories, { root: true })
    }
  },

  /**
   * Once a gcode script has run, the
   * socket notifies us of the result of
   * the specific request here.
   */
  async onGcodeScript ({ dispatch }, payload) {
    // If the response is not ok, pass it to the console.
    if (payload && payload.result && payload.result !== 'ok') {
      dispatch('addConsoleEntry', { message: Globals.CONSOLE_RECEIVE_PREFIX + payload.result })
    }
  },

  /**
   * Klipper provides us with a list of available gcode commands
   * based on the current configuration.
   */
  async onGcodeHelp ({ commit }, payload) {
    commit('setGcodeHelp', payload)
  },

  /**
   * Stores the printers object list.
   */
  async onPrinterObjectsList ({ commit, rootState }, payload) {
    // Given our object list, subscribe to any data we'd want constant updates for
    // and prepopulate our store.
    // Also ensure we init the chart data with the labels
    // we know we'll need.
    let intendedSubscriptions = {}
    payload.objects.forEach((k: string) => {
      if (!k.includes('menu') && !k.includes('gcode_macro')) {
        intendedSubscriptions = { ...intendedSubscriptions, [k]: null }
      }
      let key = k
      if (k.includes(' ')) key = key.replace(' ', '.')
      commit('onPrinterObjectsList', key)
    })

    const macros: Macro[] = payload.objects
      .filter((item: string) => item.startsWith('gcode_macro'))
      .map((item: string) => {
        const name = item.split(' ')[1]
        const hidden = rootState.config?.uiSettings?.dashboard?.hiddenMacros.includes(name)
        return { name, visible: !hidden }
      })
    commit('setMacros', macros)

    SocketActions.printerObjectsSubscribe(intendedSubscriptions)
  },

  /**
   * On a fresh load of the UI, we load prior gcode / console history
   */
  async onGcodeStore ({ dispatch }, payload) {
    if (payload && payload.gcode_store) {
      payload.gcode_store.forEach((s: ConsoleEntry) => {
        s.message = Globals.CONSOLE_RECEIVE_PREFIX + s.message
        dispatch('addConsoleEntry', s)
      })
    }
  },

  /**
   * Loads stored server data for the past 20 minutes.
   */
  async onTemperatureStore ({ commit, rootState }, payload) {
    const now = new Date() // Set a base time to work out the temp data from.
    // On a fresh boot of the host system, moonraker should give us enough data;
    // however, it seems sometimes it does not. So - we should pad this out when
    // we need to.
    // Otherwise, for a system that has been running for a bit - we should expect
    // enough data from moonraker to start with.

    // Note that some items come back with targets when they should not,
    // so we have to account for this too.

    // how many datasets to add. Moonraker should give us 20 minutes, in 1 second intervals.. but we only need 10 minutes.
    // const count = Globals.CHART_HISTORY_RETENTION // The size of the dataset we need.
    const count = (rootState.config)
      ? rootState.config.serverConfig.server.temperature_store_size
      : Globals.CHART_HISTORY_RETENTION
    const targetsToAvoid = [
      'temperature_probe',
      'temperature_sensor'
    ]

    for (const originalKey in payload) { // each heater / temp fan
      // If the dataset is less than what we need, then pad the beginning
      // until we get to our intended count
      if (targetsToAvoid.some(e => originalKey.startsWith(e))) {
        delete payload[originalKey].targets
      }
      ['temperatures', 'targets', 'powers', 'speeds'].forEach((k) => {
        const arr = payload[originalKey][k]
        if (arr && arr.length) {
          if (arr.length < count) {
            const length = count - arr.length
            const lastValue = payload[originalKey][k][0]
            payload[originalKey][k] = [...Array.from({ length }, () => lastValue), ...payload[originalKey][k]]
          } else {
            payload[originalKey][k] = payload[originalKey][k].splice(arr.length - count)
          }
        }
      })
    }

    const keys = Object.keys(payload)
    const d: ChartData[] = []
    for (let i = 0; i < count; i++) {
      const date = new Date(now.getTime() - (1000 * (count - i)) - 2000)
      const r: ChartData = {
        date
      }
      keys.forEach(key => {
        let label = key
        if (key.includes(' ')) label = key.split(' ')[1]
        r[label] = payload[key].temperatures[i]
        if ('targets' in payload[key]) r[`${label}Target`] = payload[key].targets[i]
        if ('powers' in payload[key]) r[`${label}Power`] = payload[key].powers[i]
        if ('speeds' in payload[key]) r[`${label}Speed`] = payload[key].speeds[i]
      })
      d.push(r)
    }
    commit('addChartStore', d)

    // After we've loaded the initial temp data, load and subscribe to the rest.
    SocketActions.printerObjectsList()
  },

  async onPrinterObjectsSubscribe ({ commit, dispatch }, payload) {
    // Accept notifications, and commit the first subscribe.
    commit('onAcceptNotifications')
    dispatch('notifyStatusUpdate', payload.status)
  },

  /**
   * ==========================================================================
   * Automated notifications via socket
   * Note that klipper will send an update every 250ms, if the data CHANGED.
   * This applies per object subscribed - which can add up.
   * ==========================================================================
   */

  /** Automated notify events via socket */
  async notifyStatusUpdate ({ state, rootState, commit, getters }, payload) {
    // TODO: We potentially get many updates here.
    // Consider caching the updates and sending them every <interval>.
    // We don't want to miss an update - but also don't need all of them
    // so quickly.

    // Take payload, put it in buffer object.
    // add setTimeout to empty the buffer and run the below..

    // Do NOT accept notification updates until our subscribe comes back.
    // This is because moonraker currently sends notification updates
    // prior to subscribing on browser refresh.
    if (payload && state.acceptingNotifications) {
      for (const key in payload) {
        const val = payload[key]
        // Skip anything we need here.
        if (
          !key.includes('gcode_macro')
        ) {
          // First, commit the value.
          commit('onSocketNotify', { key, payload: val })
        }
      }

      // For every notify - configure a chart entry and post it..
      // But only ever 1000ms.
      const date1 = new Date()
      const date2 = (state.chart.length > 0)
        ? new Date(state.chart[state.chart.length - 1].date)
        : null
      const diff = 1000 // time to wait before adding another entry.
      if (!date2 || date1.getTime() - date2.getTime() > diff) {
        const keys = getters.getChartableSensors as string[]
        const data = configureChartEntry(state, keys)
        const retention = (rootState.config)
          ? rootState.config.serverConfig.server.temperature_store_size
          : Globals.CHART_HISTORY_RETENTION
        commit('addChartEntry', { data, retention })
      }

      // The first notification should have pre-populated any data & chart labels, so mark the socket as ready.
      if (!state.ready) commit('onSocketReadyState', true)
    }
  },

  /**
   * Any gcode related responses are notified to us here,
   * irrelevant on if this was a specific request or not.
   */
  async notifyGcodeResponse ({ dispatch }, payload) {
    dispatch('addConsoleEntry', { message: `${Globals.CONSOLE_RECEIVE_PREFIX}${payload}` })
  },
  async notifyKlippyDisconnected ({ commit }) {
    commit('resetState', false)
    SocketActions.printerInfo()
  },
  async notifyKlippyShutdown ({ commit }) {
    commit('resetState', false)
    SocketActions.printerInfo()
  },
  async notifyKlippyReady () {
    console.debug('Klippy Ready')
  },
  async notifyFilelistChanged ({ dispatch }, payload) {
    dispatch('files/notify' + Vue.$filters.capitalize(payload.action), payload, { root: true })
  },
  async notifyMetadataUpdate ({ dispatch }, payload) {
    dispatch('files/onFileUpdate', payload, { root: true })
  },
  async notifyPowerChanged ({ dispatch }, payload) {
    dispatch('devicePower/onStatus', { [payload.device]: payload.status }, { root: true })
  },
  async notifyUpdateResponse ({ dispatch }, payload) {
    dispatch('version/onUpdateResponse', payload, { root: true })
  },
  async notifyUpdateRefreshed ({ dispatch }, payload) {
    dispatch('version/onUpdateStatus', payload, { root: true })
  },

  /**
   * ==========================================================================
   *  Non specific socket requests
   * ==========================================================================
   */
  async addConsoleEntry ({ commit }, payload: ConsoleEntry) {
    payload.message = payload.message.replace(/(?:\r\n|\r|\n)/g, '<br />')
    if (!payload.time || payload.time <= 0) {
      payload.time = new Date().getTime() / 1000 | 0
    }
    if (!payload.type) {
      payload.type = 'response'
    }
    commit('addConsoleEntry', payload)
  },

  async updateMacro ({ commit }, macro) {
    commit('updateMacro', macro)
  }
}
