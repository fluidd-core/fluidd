import type { ActionTree } from 'vuex'
import { consola } from 'consola'
import type { SocketError, SocketState, SocketStatus } from './types'
import type { RootState } from '../types'
import { Globals } from '@/globals'
import { SocketActions } from '@/api/socketActions'
import { EventBus } from '@/eventBus'
import { upperFirst, camelCase } from 'lodash-es'
import { jwtDecode } from 'jwt-decode'
import type { TokenKeys } from '../config/types'
import i18n from '@/plugins/i18n'

const MODULES_TO_RESET_ON_DROP = [
  'server',
  'power',
  'webcams',
  'jobQueue',
  'wait',
  'gcodePreview'
] as const

let retryTimeout: ReturnType<typeof setTimeout>

// State machine edges. Self-transitions (same → same) are accepted as no-ops.
const VALID_TRANSITIONS: Record<SocketStatus, readonly SocketStatus[]> = {
  initializing: ['connecting', 'disconnected'],
  disconnected: ['connecting'],
  connecting: ['disconnected', 'identifying'],
  identifying: ['connecting', 'authenticating', 'ready'],
  authenticating: ['connecting', 'identifying'],
  ready: ['disconnected', 'connecting', 'authenticating']
}

const tryGetErrorMessageFromJson = (message: string): string | null => {
  try {
    // If our message contains JSON, we should try to parse it.
    // This was a problem in old versions of Moonraker, not sure if it's still the case, but it doesn't hurt to be defensive here.
    const messageAsObject = JSON.parse(message.replace(/'/g, '"'))

    if (
      messageAsObject !== null &&
      typeof messageAsObject === 'object' &&
      'message' in messageAsObject &&
      typeof messageAsObject.message === 'string'
    ) {
      return messageAsObject.message
    }
  } catch {
    // ignore and assume it's a plain string
  }

  return null
}

const isSocketError = (value: unknown): value is SocketError =>
  value != null &&
  typeof value === 'object' &&
  'code' in value &&
  typeof value.code === 'number' &&
  'message' in value &&
  typeof value.message === 'string'

const getMoonrakerDatabase = async <T = Record<string, unknown>>(namespace: string) => {
  try {
    const response = await SocketActions.serverDatabaseGetItem<T>(undefined, namespace)

    return response.value
  } catch (e) {
    consola.debug('Error reading database namespace', namespace, e)

    return {} as T
  }
}

const isTokenExpired = (rawToken: string): boolean => {
  try {
    const { exp } = jwtDecode(rawToken)
    return exp !== undefined && exp * 1000 < Date.now()
  } catch {
    return true
  }
}

const getAccessToken = async (keys: TokenKeys): Promise<string | null> => {
  const token = localStorage.getItem(keys.userToken)

  if (token && !isTokenExpired(token)) {
    return token
  }

  const refreshToken = localStorage.getItem(keys.refreshToken)

  if (refreshToken && !isTokenExpired(refreshToken)) {
    try {
      const response = await SocketActions.accessRefreshJwt(refreshToken)

      if (response.token) {
        localStorage.setItem(keys.userToken, response.token)

        return response.token
      }
    } catch (e) {
      consola.error('Error during token refresh', e)

      // if it's NOT a 401, bail out without touching tokens; otherwise fall
      // through to the clear at the bottom.
      if (
        !isSocketError(e) ||
        e.code !== 401
      ) {
        return null
      }
    }
  }

  localStorage.removeItem(keys.userToken)
  localStorage.removeItem(keys.refreshToken)

  return null
}

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
   *  - `connecting`:     clears per-socket identity (the socket client opens
   *                      the socket and owns the retry loop).
   *  - `identifying`:    run `runIdentify` — token refresh + identify, then
   *                      the post-auth bootstrap (DB load + serverInfo etc.),
   *                      then dispatch `ready` (or `authenticating` on failure).
   *  - `authenticating`: no side-effects — App.vue reacts to `socketAuthenticating`
   *                      and renders the Login overlay over the current route.
   *  - `ready`:          no side-effects — bootstrap already ran inside
   *                      `runIdentify`; entering `ready` unblocks the main app render.
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
    consola.debug(`Socket status: ${prev} → ${next}`)
    commit('setStatus', next)

    switch (next) {
      case 'connecting':
        commit('setAcceptNotifications', false)
        commit('setConnectionId', null)

        if (prev === 'ready') {
          await Promise.all([
            dispatch('charts/resetChartStore', undefined, { root: true }),
            dispatch('reset', MODULES_TO_RESET_ON_DROP, { root: true })
          ])
        }

        break

      case 'identifying':
        await dispatch('runIdentify')

        break
    }
  },

  /**
   * Identify flow. Called by onSetStatus when entering `identifying`. Pre-checks
   * token expiry: if the access token is expired but the refresh token is valid,
   * refreshes first. If both are expired, identify is still called but without an
   * access token (anonymous/trusted identify). Terminal transitions: → `ready` on
   * success; → `authenticating` on auth failure; → `ready` with a warning on
   * JSON-RPC -32601 (very old Moonraker that predates `server.connection.identify`).
   * Aborts silently if the socket drops mid-flight.
   */
  async runIdentify ({ dispatch, rootGetters, state }) {
    // Skip identify when the socket is already identified (e.g. post-access.login
    // re-uses the same physical socket; Moonraker has already re-authenticated it
    // as the new user). server.connection.identify is one-shot per connection.
    if (state.connectionId === null) {
      const keys: TokenKeys = rootGetters['config/getTokenKeys']
      const accessToken = await getAccessToken(keys)

      try {
        await SocketActions.serverConnectionIdentify({
          client_name: Globals.APP_NAME,
          version: `${import.meta.env.VERSION || '0.0.0'}-${import.meta.env.HASH || 'unknown'}`.trim(),
          type: 'web',
          url: Globals.GITHUB_REPO,
          ...(accessToken ? { access_token: accessToken } : {})
        })
      } catch (e) {
        consola.debug('identify failed', e)

        if (state.status !== 'identifying') return

        // Very old Moonraker that predates server.connection.identify returns
        // JSON-RPC -32601 ("Method not found"). Warn the user and continue
        // loading unauthenticated through the normal bootstrap → ready path.
        if (
          isSocketError(e) &&
          e.code === -32601
        ) {
          EventBus.$emit(
            i18n.t('app.version.label.old_component_version', { name: 'Moonraker', version: Globals.MOONRAKER_MIN_VERSION }).toString(),
            { type: 'warning' }
          )

          await dispatch('server/notifyOldMoonraker', undefined, { root: true })
        } else {
          await dispatch('onSetStatus', 'authenticating')

          return
        }
      }
    }

    if (state.status !== 'identifying') return

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

    if (state.status !== 'identifying') return

    // allSettled so a single failing RPC (e.g. transient 503) does not throw
    // out of runIdentify and leave the status stuck at `identifying`. Each
    // RPC's dispatch handler runs only on success; partial state is acceptable
    // because individual UI components handle missing data.
    await Promise.allSettled([
      SocketActions.serverInfo(),
      SocketActions.serverConfig(),
      SocketActions.machineProcStats(),
      SocketActions.machineSystemInfo(),
      SocketActions.serverFilesList('config')
    ])

    if (state.status !== 'identifying') return

    await dispatch('onSetStatus', 'ready')
  },

  /**
   * Fired when the socket encounters an error. ws.onclose always follows and
   * drives the transition; here we just surface RPC error codes.
   */
  async onSocketError ({ state, commit }, payload: SocketError) {
    if (
      state.status === 'ready' &&
      payload.code >= 400 &&
      payload.code < 500
    ) {
      const message = (
        tryGetErrorMessageFromJson(payload.message) ||
        payload.message
      )

      EventBus.$emit(message, { type: 'error' })
    } else if (payload.code === 503) {
      // Klippy non-responsive or config error. Retry serverInfo after a delay.
      commit('printer/setPrinterInfo', { state: 'error', state_message: payload.message }, { root: true })
      clearTimeout(retryTimeout)
      retryTimeout = setTimeout(() => {
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
    const keys: TokenKeys = rootGetters['config/getTokenKeys']
    localStorage.removeItem(keys.userToken)
    localStorage.removeItem(keys.refreshToken)
    commit('auth/setCurrentUser', null, { root: true })

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
