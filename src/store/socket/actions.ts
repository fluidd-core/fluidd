import Vue from 'vue'
import type { ActionTree } from 'vuex'
import { consola } from 'consola'
import type { SocketState, SocketStatus } from './types'
import type { RootState } from '../types'
import { Globals } from '@/globals'
import { SocketActions } from '@/api/socketActions'
import { EventBus } from '@/eventBus'
import { upperFirst, camelCase } from 'lodash-es'

const MODULES_TO_RESET_ON_DROP = ['server', 'power', 'webcams', 'jobQueue', 'wait', 'gcodePreview']

// State machine edges. Self-transitions (same → same) are accepted as no-ops.
const VALID_TRANSITIONS: Record<SocketStatus, readonly SocketStatus[]> = {
  disconnected: ['connecting'],
  connecting: ['disconnected', 'identifying'],
  identifying: ['connecting', 'authenticating', 'ready'],
  authenticating: ['connecting', 'identifying'],
  ready: ['disconnected', 'connecting', 'authenticating']
}

const getMoonrakerDatabase = async <T = Record<string, unknown>>(namespace: string) => {
  try {
    const response = await SocketActions.serverDatabaseGetItem<T>(undefined, namespace)

    return response.value
  } catch (e) {
    consola.debug('Error reading database namespace', namespace, e)

    return {} as T
  }
}

const getIdentifyParams = (accessToken?: string): {
  client_name: string;
  version: string;
  type: string;
  url: string;
  access_token?: string;
} => ({
  client_name: Globals.APP_NAME,
  version: `${import.meta.env.VERSION || '0.0.0'}-${import.meta.env.HASH || 'unknown'}`.trim(),
  type: 'web',
  url: Globals.GITHUB_REPO,
  ...(accessToken ? { access_token: accessToken } : {})
})

let retryTimeout: number

export const actions = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * ==========================================================================
   * State-machine transitions driven by the socket client
   * ==========================================================================
   */

  /**
   * Single gateway for socket status changes. Validates the transition,
   * commits the new state, then runs the side-effects for the destination
   * state. Every caller (socket client, auth actions, identify flow) goes
   * through this instead of committing `setStatus` directly.
   *
   *  - `disconnected`:   no side-effects.
   *  - `connecting`:     no side-effects (the socket client opens the socket
   *                      and owns the retry loop).
   *  - `identifying`:    run the identify + one-shot refresh flow and, on
   *                      the outcome, transition to `ready` or `authenticating`.
   *  - `authenticating`: route to /login if we're not already there.
   *  - `ready`:          route off /login if needed, then run the app
   *                      bootstrap (serverInfo + Moonraker DB + config files).
   *
   * Entering `connecting` always clears per-socket identity so `runIdentify`
   * can re-identify the new physical session. Coming from `ready` additionally
   * resets modules that held live data from the dropped connection.
   */
  async onSetStatus ({ commit, dispatch, state }, next: SocketStatus) {
    if (state.status === next) return
    if (!VALID_TRANSITIONS[state.status].includes(next)) {
      consola.warn(`Invalid socket status transition: ${state.status} → ${next}`)
      return
    }

    const prev = state.status
    consola.log(`Socket status: ${prev} → ${next}`)
    commit('setStatus', next)

    if (next === 'connecting') {
      commit('setAcceptNotifications', false)
      commit('setConnectionId', null)

      if (prev === 'ready') {
        await Promise.all([
          dispatch('charts/resetChartStore', undefined, { root: true }),
          dispatch('reset', MODULES_TO_RESET_ON_DROP, { root: true })
        ])
      }
    }

    switch (next) {
      case 'identifying':
        await dispatch('runIdentify')
        break

      case 'authenticating':
        if (Vue.$filters.getCurrentRouteName() !== 'login') {
          await Vue.$filters.routeTo({ name: 'login' })
        }
        break

      case 'ready':
        if (Vue.$filters.getCurrentRouteName() === 'login') {
          await Vue.$filters.routeTo({ name: 'home' })
        }
        await dispatch('runBootstrap')
        break
    }
  },

  /**
   * Identify flow. Called by onSetStatus when entering `identifying`. Fires
   * server.connection.identify with whatever access token we have (or none);
   * on failure, refreshes the token once and retries. Terminal transitions:
   * → `ready` on success, → `authenticating` on failure. Aborts silently if
   * the socket drops mid-flight (state moves out of 'identifying').
   */
  async runIdentify ({ dispatch, rootGetters, state }) {
    if (state.status !== 'identifying') return

    // Moonraker's server.connection.identify is one-shot per socket. If we
    // already have a connectionId, the socket is identified and the RPC
    // would be rejected — land in ready directly. This is the logout→login
    // path where the same socket carries a new user after access.login.
    if (state.connectionId !== null) {
      await dispatch('onSetStatus', 'ready')
      return
    }

    const tokenKeys = rootGetters['config/getTokenKeys']
    let accessToken = localStorage.getItem(tokenKeys['user-token']) || undefined

    const tryIdentify = async () => {
      try {
        await SocketActions.serverConnectionIdentify(getIdentifyParams(accessToken))
        return true
      } catch (e) {
        consola.debug('identify failed', e)
        return false
      }
    }

    let ok = await tryIdentify()
    if (state.status !== 'identifying') return

    if (!ok) {
      const newToken = await dispatch('auth/refreshTokens', undefined, { root: true }) as string | undefined
      if (state.status !== 'identifying') return
      if (newToken) {
        accessToken = newToken
        ok = await tryIdentify()
        if (state.status !== 'identifying') return
      }
    }

    await dispatch('onSetStatus', ok ? 'ready' : 'authenticating')
  },

  /**
   * Post-identify bootstrap. Called by onSetStatus when entering `ready`.
   * Loads server info, the Moonraker database namespaces Fluidd owns, and the
   * config file list. Split out of onSetStatus for readability.
   */
  async runBootstrap ({ dispatch }) {
    SocketActions.serverInfo()

    await Promise.all(
      Object.values(Globals.MOONRAKER_DB).map(async ({ NAMESPACE, ROOTS }) => {
        const roots = Object.values<{
          name: string;
          dispatch: string;
          migrate_only?: boolean;
        }>(ROOTS)

        if (roots.length === 0) {
          return
        }

        const data = await getMoonrakerDatabase(NAMESPACE)

        await Promise.all(
          roots.map(async (root) => {
            const value = root.name ? data[root.name] : data

            if (root.migrate_only) {
              if (value) {
                await dispatch(root.dispatch, value, { root: true })
              }
            } else {
              if (!value) {
                try {
                  await SocketActions.serverDatabasePostItem(root.name, {}, NAMESPACE)
                } catch (e) {
                  consola.debug('Error creating database item', e)
                }
              }

              await dispatch(root.dispatch, value || {}, { root: true })
            }
          })
        )
      })
    )

    SocketActions.serverFilesList('config')
  },

  /**
   * Fired when the socket encounters an error. ws.onclose always follows and
   * drives the transition; here we just surface RPC error codes.
   */
  async onSocketError ({ commit }, payload) {
    if (payload.code >= 400 && payload.code < 500) {
      // If our message contains json, we should try to parse it.
      // This is pretty bad, should get moonraker to fix this response.
      let message = ''
      try {
        const messageAsObject = JSON.parse(payload.message.replace(/'/g, '"')) as { message: string }

        message = messageAsObject.message
      } catch {
        message = payload.message
      }

      EventBus.$emit(message, { type: 'error' })
    }
    if (payload.code === 503) {
      // Klippy non-responsive or config error. Retry serverInfo after a delay.
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
  async onConnectionId ({ commit }, payload: Moonraker.Websocket.ConnectionIdentifyResponse) {
    commit('setConnectionId', payload.connection_id)
  },

  /**
   * ==========================================================================
   * Automated notifications via socket
   * Note that klipper will send an update every 250ms, if the data CHANGED.
   * This applies per object subscribed - which can add up.
   * ==========================================================================
   */

  async notifyStatusUpdate ({ dispatch }, payload) {
    await dispatch('printer/onNotifyStatusUpdate', payload, { root: true })
  },

  async notifyGcodeResponse ({ dispatch }, payload) {
    dispatch('console/onAddConsoleEntry', { message: `${Globals.CONSOLE_RECEIVE_PREFIX}${payload}` }, { root: true })
  },

  /**
   * This is fired when, for example - the service is stopped.
   */
  async notifyKlippyDisconnected ({ dispatch }) {
    await dispatch('resetKlippy', undefined, { root: true })

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

  /**
   * Moonraker invalidated the current session (we triggered logout, or another
   * client called access.logout with invalidate=true). Clear local auth state
   * and drop to `authenticating` so the login view takes over on the same
   * socket.
   */
  async notifyUserLoggedOut ({ commit, dispatch, rootGetters, state }) {
    const keys = rootGetters['config/getTokenKeys']
    localStorage.removeItem(keys['user-token'])
    localStorage.removeItem(keys['refresh-token'])
    commit('auth/setCurrentUser', null, { root: true })
    commit('auth/setToken', null, { root: true })
    commit('auth/setRefreshToken', null, { root: true })

    if (state.status === 'ready' || state.status === 'identifying') {
      await dispatch('onSetStatus', 'authenticating')
    }
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
} satisfies ActionTree<SocketState, RootState>
