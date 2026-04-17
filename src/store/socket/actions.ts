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
   * Actions called via the socket client
   * ==========================================================================
   */

  /**
    * Fired when the socket opens.
    */
  async onSocketOpen ({ commit, dispatch, rootGetters }, payload) {
    commit('setSocketOpen', payload)
    if (payload !== true) return

    // 1. Check the connection's trust / auth status before loading data.
    let info: Moonraker.Authorization.InfoResponse | undefined
    try {
      info = await SocketActions.accessInfo()
    } catch (e) {
      consola.debug('accessInfo failed on socket open', e)
    }

    // login_required is the authoritative flag: when force_logins is enabled
    // with at least one user configured, Moonraker reports login_required:true
    // for EVERY connection, including trusted ones (trusted_clients is
    // overridden in that mode). If accessInfo failed and info is undefined,
    // assume auth is needed and let the flow below deal with it.
    const needsAuth = info?.login_required !== false
    const tokenKeys = rootGetters['config/getTokenKeys']

    if (needsAuth) {
      let accessToken = localStorage.getItem(tokenKeys['user-token'])

      const tryIdentify = async () => {
        if (!accessToken) return false
        try {
          await SocketActions.serverConnectionIdentify(getIdentifyParams(accessToken))
          return true
        } catch (e) {
          consola.debug('identify with stored token failed', e)
          return false
        }
      }

      let authenticated = await tryIdentify()

      if (!authenticated && accessToken) {
        // Token may have expired. Try a refresh and retry once.
        const newToken = await dispatch('auth/refreshTokens', undefined, { root: true }) as string | undefined
        if (newToken) {
          accessToken = newToken
          authenticated = await tryIdentify()
        }
      }

      if (!authenticated) {
        // No usable credentials — kick the user to /login. Socket stays open
        // so the login view can still call access.info / access.login.
        await dispatch('auth/logout', undefined, { root: true })
        return
      }
    } else {
      try {
        await SocketActions.serverConnectionIdentify(getIdentifyParams())
      } catch (e) {
        consola.debug('identify (unauthenticated) failed', e)
      }
    }

    await dispatch('onAuthReady')
  },

  /**
   * Fired by auth/login after access.login succeeds on the existing socket.
   * The connection is already authenticated server-side; identify cements
   * Fluidd's client metadata on it, then the shared post-auth bootstrap runs.
   */
  async onLoginComplete ({ dispatch }, accessToken: string) {
    try {
      await SocketActions.serverConnectionIdentify(getIdentifyParams(accessToken))
    } catch (e) {
      consola.debug('identify after login failed', e)
    }

    await dispatch('onAuthReady')
  },

  /**
   * Post-identify bootstrap. Commits the authenticated flag, bounces the user
   * off /login if that's where they were, and loads server info + Moonraker
   * database + config file list. Shared by the onSocketOpen success path and
   * the auth/login → socket/onLoginComplete post-login path.
   */
  async onAuthReady ({ commit, dispatch }) {
    commit('auth/setAuthenticated', true, { root: true })

    if (Vue.$filters.getCurrentRouteName() === 'login') {
      await Vue.$filters.routeTo({ name: 'home' })
    }

    SocketActions.serverInfo()

    await Promise.all(
      Object.values(Globals.MOONRAKER_DB).map(async ({ NAMESPACE, ROOTS }) => {
        const data = await getMoonrakerDatabase(NAMESPACE)

        const roots = Object.values<{
          name: string;
          dispatch: string;
          migrate_only?: boolean;
        }>(ROOTS)

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
   * Fired when the socket closes.
   */
  async onSocketClose ({ dispatch, commit, state }, event: CloseEvent) {
    const retry = state.disconnecting
    const modules = ['server', 'power', 'webcams', 'jobQueue', 'socket', 'wait', 'gcodePreview']

    if (event.wasClean && retry) {
      // This is most likely a moonraker restart, so only partially reset.
      await Promise.all([
        dispatch('charts/resetChartStore', undefined, { root: true }),
        dispatch('reset', modules, { root: true })
      ])
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
      await Promise.all([
        dispatch('charts/resetChartStore', undefined, { root: true }),
        dispatch('reset', modules, { root: true })
      ])
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
        const messageAsObject = JSON.parse(payload.message.replace(/'/g, '"')) as { message: string }

        message = messageAsObject.message
      } catch {
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
  async onConnectionId ({ commit }, payload: Moonraker.Websocket.ConnectionIdentifyResponse) {
    commit('setConnectionId', payload.connection_id)
  },

  async onServerRead ({ dispatch }, payload: Moonraker.Database.GetItemResponse) {
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
