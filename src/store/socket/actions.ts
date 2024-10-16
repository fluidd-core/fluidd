import Vue from 'vue'
import type { ActionTree } from 'vuex'
import { consola } from 'consola'
import type { SocketState } from './types'
import type { RootState } from '../types'
import { Globals } from '@/globals'
import { SocketActions } from '@/api/socketActions'
import { EventBus } from '@/eventBus'
import { upperFirst, camelCase } from 'lodash-es'
import isKeyOf from '@/util/is-key-of'

let retryTimeout: number

export const actions: ActionTree<SocketState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * ==========================================================================
   * Actions called via the socket client
   * ==========================================================================
   */

  /**
    * Fired when the socket opens.
    */
  async onSocketOpen ({ commit }, payload) {
    commit('setSocketOpen', payload)
    if (payload === true) {
      SocketActions.serverInfo()
      SocketActions.identify({
        client_name: Globals.APP_NAME,
        version: `${import.meta.env.VERSION || '0.0.0'}-${import.meta.env.HASH || 'unknown'}`.trim(),
        type: 'web',
        url: Globals.GITHUB_REPO
      })
      SocketActions.serverFilesListRoot('config')
    }
  },

  /**
   * Fired when the socket closes.
   */
  async onSocketClose ({ dispatch, commit, state }, event: CloseEvent) {
    const retry = state.disconnecting
    const modules = ['server', 'power', 'webcams', 'jobQueue', 'charts', 'socket', 'wait', 'gcodePreview']

    if (event.wasClean && retry) {
      // This is most likely a moonraker restart, so only partially reset.
      await dispatch('reset', modules, { root: true })
      commit('setSocketConnecting', true)
      Vue.$socket.connect()
    }

    if (event.wasClean && !retry) {
      // Set the socket state to closed.
      // If we swap printer endpoints, then the init will run
      // which will reset the state if necessary.
      commit('setSocketConnecting', false)
      commit('setSocketOpen', false)
    }

    if (!event.wasClean) {
      // Not a clean disconnect. Service went down?
      // Socket should attempt to reconnect itself.
      await dispatch('reset', modules, { root: true })
      commit('setSocketConnecting', true)
      commit('setSocketOpen', false)
    }
  },

  /**
   * Sets state based on if we're attempting to reconnect
   * the socket or not. If we are not, then the user
   * can invoke a forced refresh.
   */
  async onSocketConnecting ({ commit }, payload) {
    commit('setSocketConnecting', payload)
  },

  /**
   * Fired when the socket encounters an error.
   * We might see an error under code 400 for invalid circumstances, like
   * trying to extrude under temp. Should present the user with an error
   * for these cases.
   * Another case might be during a klippy shutdown.
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

      EventBus.$emit(message, { type: 'error' })
    }
    if (payload.code === 503) {
      // This indicates klippy is non-responsive, or there's a configuration error
      // in klipper. We should retry after the set delay.
      // Restart our startup sequence.

      // Forcefully set the printer in error
      commit('printer/setPrinterInfo', { state: 'error', state_message: payload.message }, { root: true })
      clearTimeout(retryTimeout)
      retryTimeout = window.setTimeout(() => {
        SocketActions.serverInfo()
      }, Globals.KLIPPY_RETRY_DELAY)
    }
  },

  /**
   * Fired when the socket [identifies](https://moonraker.readthedocs.io/en/latest/web_api/#identify-connection).
   * Required for [HTTP-based subscriptions](https://moonraker.readthedocs.io/en/latest/web_api/#subscribe-to-printer-object-status).
   */
  async onConnectionId ({ commit }, { connection_id }) {
    commit('setConnectionId', connection_id)
  },

  async onServerRead ({ dispatch }, payload: {namespace: string, key?: string, value: unknown}) {
    const { namespace, key, value } = payload

    if (isKeyOf(namespace, Globals.MOONRAKER_DB)) {
      const roots = Globals.MOONRAKER_DB[namespace].ROOTS

      const root = key && isKeyOf(key, roots) ? roots[key] : Object.values(roots)[0]

      dispatch(root.dispatch, value, { root: true })
    }
  },

  /**
   * ==========================================================================
   * Automated notifications via socket
   * Note that klipper will send an update every 250ms, if the data CHANGED.
   * This applies per object subscribed - which can add up.
   * ==========================================================================
   */

  async notifyStatusUpdate ({ state, commit, dispatch }, payload) {
    await dispatch('printer/onNotifyStatusUpdate', payload, { root: true })

    if (!state.ready) commit('setSocketReadyState', true)
  },

  async notifyGcodeResponse ({ dispatch }, payload) {
    dispatch('console/onAddConsoleEntry', { message: `${Globals.CONSOLE_RECEIVE_PREFIX}${payload}` }, { root: true })
  },

  /**
   * This is fired when, for example - the service is stopped.
   */
  async notifyKlippyDisconnected () {
    SocketActions.serverInfo()
  },

  /**
   * This is fired when, for example - an estop is emitted.
   */
  async notifyKlippyShutdown () {
    SocketActions.serverInfo()
  },

  async notifyKlippyReady () {
    consola.debug('Klippy Ready')
  },

  async notifyFilelistChanged ({ dispatch }, payload) {
    dispatch('files/notify' + upperFirst(camelCase(payload.action)), payload, { root: true })
  },

  // Next release, remove.
  async notifyMetadataUpdate ({ dispatch }, payload) {
    dispatch('files/onFileMetaData', payload, { root: true })
  },

  async notifyPowerChanged ({ dispatch }, payload) {
    dispatch('power/onStatus', { [payload.device]: payload.status }, { root: true })
  },

  async notifyUpdateResponse ({ dispatch }, payload) {
    dispatch('version/onUpdateResponse', payload, { root: true })
  },

  async notifyUpdateRefreshed ({ dispatch }, payload) {
    dispatch('version/onUpdateStatus', payload, { root: true })
  },

  async notifyHistoryChanged ({ dispatch }, payload) {
    dispatch('history/onHistoryChange', payload, { root: true })
  },

  async notifyCpuThrottled ({ dispatch }, payload) {
    dispatch('server/onMachineThrottledState', payload, { root: true })
  },

  async notifyProcStatUpdate ({ dispatch }, payload) {
    dispatch('server/onMachineProcStats', payload, { root: true })
  },

  async notifyUserCreated ({ dispatch }, payload) {
    dispatch('auth/onUserCreated', payload, { root: true })
  },

  async notifyUserDeleted ({ dispatch }, payload) {
    dispatch('auth/onUserDeleted', payload, { root: true })
  },

  async notifyServiceStateChanged ({ dispatch }, payload) {
    dispatch('server/onServiceStateChanged', payload, { root: true })
  },

  async notifyTimelapseEvent ({ dispatch }, payload) {
    dispatch('timelapse/onEvent', payload, { root: true })
  },

  async notifyAnnouncementUpdate ({ dispatch }, payload) {
    dispatch('announcements/onAnnouncementUpdate', payload, { root: true })
  },

  async notifyAnnouncementDismissed ({ dispatch }, payload) {
    dispatch('announcements/onAnnouncementDismissed', payload, { root: true })
  },

  async notifyAnnouncementWake ({ dispatch }, payload) {
    dispatch('announcements/onAnnouncementWake', payload, { root: true })
  },

  async notifyWebcamsChanged ({ dispatch }, payload) {
    dispatch('webcams/onWebcamsChanged', payload, { root: true })
  },

  async notifySensorUpdate ({ dispatch }, payload) {
    dispatch('sensors/onSensorUpdate', payload, { root: true })
  },

  async notifyJobQueueChanged ({ dispatch }, payload) {
    dispatch('jobQueue/onJobQueueChanged', payload, { root: true })
  },

  async notifyActiveSpoolSet ({ dispatch }, payload) {
    dispatch('spoolman/onActiveSpool', payload, { root: true })
  },

  async notifySpoolmanStatusChanged ({ dispatch }, payload) {
    dispatch('spoolman/onStatusChanged', payload.spoolman_connected, { root: true })
  }
}
