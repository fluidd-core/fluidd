import Vue from 'vue'
import { ActionTree } from 'vuex'
import consola from 'consola'
import { SocketState } from './types'
import { RootState } from '../types'
import { Globals } from '@/globals'
import { SocketActions } from '@/socketActions'
import { EventBus, FlashMessageTypes } from '@/eventBus'

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
    SocketActions.serverInfo()
  },

  /**
   * Fired when the socket closes.
   */
  async onSocketClose ({ dispatch, commit, state }, e: CloseEvent) {
    const retry = state.disconnecting
    if (e.wasClean && retry) {
      // This is most likely a moonraker restart, so only partially reset.
      await dispatch('reset', [
        'server',
        'charts',
        'socket',
        'wait'
      ], { root: true })
      Vue.$socket.connect()
    }

    if (e.wasClean && !retry) {
      // Set the socket state to closed.
      // If we swap printer endpoints, then the init will run
      // which will reset the state if necessary.
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

      EventBus.$emit(message, FlashMessageTypes.error, 5000)
    }
    if (payload.code === 503) {
      // This indicates klippy is non-responsive, or there's a configuration error
      // in klipper. We should retry after the set delay.
      // Restart our startup sequence.

      // Forcefully set the printer in error
      commit('printer/setPrinterInfo', { state: 'error', state_message: payload.message }, { root: true })
      clearTimeout(retryTimeout)
      retryTimeout = setTimeout(() => {
        SocketActions.serverInfo()
      }, Globals.KLIPPY_RETRY_DELAY)
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
    dispatch('printer/onNotifyStatusUpdate', payload, { root: true })
      .then(() => {
        if (!state.ready) commit('setSocketReadyState', true)
      })
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
    dispatch('files/notify' + Vue.$filters.capitalize(payload.action), payload, { root: true })
  },

  async notifyMetadataUpdate ({ dispatch }, payload) {
    dispatch('files/onFileUpdate', payload, { root: true })
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
  }
}
