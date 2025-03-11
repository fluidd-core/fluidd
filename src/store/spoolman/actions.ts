import type { ActionTree } from 'vuex'
import type {
  Spool,
  SpoolmanInfo,
  SpoolmanProxyResponse,
  SpoolmanProxyResponseV2,
  SpoolmanState,
  WebsocketBasePayload,
  WebsocketFilamentPayload,
  WebsocketSpoolPayload,
  WebsocketVendorPayload
} from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { consola } from 'consola'
import { EventBus } from '@/eventBus'
import { gte, valid } from 'semver'

const logPrefix = '[SPOOLMAN]'

const payloadAsSpoolmanProxyResponseV2 = <T>(payload: SpoolmanProxyResponse<T>): SpoolmanProxyResponseV2<T> => {
  if (
    payload != null &&
    typeof payload === 'object' &&
    'error' in payload &&
    'response' in payload
  ) {
    if (payload.error != null) {
      EventBus.$emit(typeof payload.error === 'string' ? payload.error : payload.error.message, { type: 'error' })
    }

    return payload
  }

  return {
    error: null,
    response: payload
  }
}

export const actions: ActionTree<SpoolmanState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Make a socket request to init the spoolman component.
   */
  async init () {
    SocketActions.serverSpoolmanGetSpoolId()
    SocketActions.serverSpoolmanProxyGetAvailableSpools()
    SocketActions.serverSpoolmanProxyGetInfo()
  },

  async onActiveSpool ({ commit }, payload) {
    commit('setActiveSpool', payload.spool_id)
  },

  async onSpoolChange ({ commit, state }, { type, payload }: WebsocketSpoolPayload) {
    const spools = [...state.availableSpools]

    switch (type) {
      case 'added': {
        spools.push(payload)

        break
      }

      case 'updated': {
        const index = spools.findIndex(spool => spool.id === payload.id)

        if (index >= 0) {
          spools[index] = payload
        }

        break
      }

      case 'deleted': {
        const index = spools.findIndex(spool => spool.id === payload.id)

        if (index >= 0) {
          spools.splice(index, 1)
        }

        break
      }
    }

    commit('setAvailableSpools', spools)
  },

  async onFilamentChange ({ commit, state }, { type, payload }: WebsocketFilamentPayload) {
    if (type !== 'updated') {
      // we only care about updated filament types
      return
    }

    const spools = [...state.availableSpools]
    for (const spool of spools) {
      if (spool.filament.id === payload.id) {
        spools[spools.indexOf(spool)] = {
          ...spool,
          filament: payload
        }
      }
    }

    commit('setAvailableSpools', spools)
  },

  async onVendorChange ({ commit, state }, { type, payload }: WebsocketVendorPayload) {
    if (type !== 'updated') {
      // we only care about updated vendors
      return
    }

    const spools = [...state.availableSpools]
    for (const spool of spools) {
      if (spool.filament.vendor?.id === payload.id) {
        spools[spools.indexOf(spool)] = {
          ...spool,
          filament: {
            ...spool.filament,
            vendor: payload
          }
        }
      }
    }

    commit('setAvailableSpools', spools)
  },

  async onStatusChanged ({ commit, dispatch }, payload: boolean) {
    if (payload) {
      // refresh data, connected state will be set on data retrieval
      dispatch('init')
    } else {
      commit('setConnected', payload)
    }
  },

  async onAvailableSpools ({ commit, dispatch }, payload: SpoolmanProxyResponse<Spool[]>) {
    payload = payloadAsSpoolmanProxyResponseV2(payload)

    if (payload.error != null) {
      return
    }

    commit('setAvailableSpools', [...payload.response])

    commit('setConnected', true)

    dispatch('initializeWebsocketConnection')
  },

  async onInfo ({ state, commit }, payload: SpoolmanProxyResponse<SpoolmanInfo>) {
    payload = payloadAsSpoolmanProxyResponseV2(payload)

    if (payload.error != null) {
      return
    }

    commit('setInfo', payload.response)

    if (
      state.info &&
      valid(state.info.version) &&
      gte(state.info.version, '0.16.0')
    ) {
      SocketActions.serverSpoolmanProxyGetSettingCurrency()
    }
  },

  async onSettingCurrency ({ commit }, payload: SpoolmanProxyResponse<{ value: string }>) {
    payload = payloadAsSpoolmanProxyResponseV2(payload)

    if (payload.error != null) {
      return
    }

    commit('setCurrency', payload.response)
  },

  async initializeWebsocketConnection ({ state, rootState, dispatch }) {
    if (rootState.server.config.spoolman?.server) {
      if (state.socket?.readyState === WebSocket.OPEN) {
        // we already have a working WS conn
        return
      }

      // init websocket to listen for updates
      const spoolmanUrl = new URL(rootState.server.config.spoolman.server)
      spoolmanUrl.pathname += `${spoolmanUrl.pathname.endsWith('/') ? '' : '/'}api/v1/`
      if (spoolmanUrl.protocol === 'https:') {
        spoolmanUrl.protocol = 'wss:'
      } else {
        spoolmanUrl.protocol = 'ws:'
      }

      state.socket = new WebSocket(spoolmanUrl)
      state.socket.onerror = err => consola.warn(`${logPrefix} received websocket error`, err)
      state.socket.onmessage = event => {
        let data: WebsocketBasePayload
        try {
          data = JSON.parse(event.data) as WebsocketBasePayload
        } catch (err) {
          consola.error(`${logPrefix} failed to decode websocket message`, err, event.data)
          return
        }

        switch (data.resource) {
          case 'spool':
            dispatch('onSpoolChange', data)
            break

          case 'filament':
            dispatch('onFilamentChange', data)
            break

          case 'vendor':
            dispatch('onVendorChange', data)
            break

          default:
            consola.warn(`${logPrefix} ignoring websocket message with type ${data.resource}`)
        }
      }
    } else {
      // destroy ws
      state.socket?.close()
      state.socket = undefined
    }
  }
}
