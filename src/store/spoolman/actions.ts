import type { ActionTree } from 'vuex'
import type {
  Spool,
  SpoolmanState,
  WebsocketBasePayload,
  WebsocketFilamentPayload,
  WebsocketSpoolPayload,
  WebsocketVendorPayload
} from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import store from '@/store'
import { consola } from 'consola'

const logPrefix = '[SPOOLMAN]'

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
  },

  async onActiveSpool ({ commit }, payload) {
    commit('setActiveSpool', payload.spool_id)
  },

  async onSpoolChange ({ commit, getters }, { type, payload }: WebsocketSpoolPayload) {
    const spools = [...getters.getAvailableSpools]
    switch (type) {
      case 'added': {
        spools.push(payload)
        break
      }

      case 'updated': {
        const index = spools.findIndex((spool: Spool) => spool.id === payload.id)
        spools[index] = payload

        break
      }

      case 'deleted': {
        const index = spools.findIndex((spool: Spool) => spool.id === payload.id)
        spools.splice(index, 1)
        break
      }
    }

    commit('setAvailableSpools', spools)
  },

  async onFilamentChange ({ commit, getters }, { type, payload }: WebsocketFilamentPayload) {
    if (type !== 'updated') {
      // we only care about updated filament types
      return
    }

    const spools = [...getters.getAvailableSpools]
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

  async onVendorChange ({ commit, getters }, { type, payload }: WebsocketVendorPayload) {
    if (type !== 'updated') {
      // we only care about updated vendors
      return
    }

    const spools = [...getters.getAvailableSpools]
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

  async onAvailableSpools ({ commit, getters, dispatch }, payload) {
    commit('setAvailableSpools', [...payload])
    if (getters.getSupported) { dispatch('initializeWebsocketConnection') }
  },

  async initializeWebsocketConnection ({ state, rootState }) {
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
        let data
        try {
          data = JSON.parse(event.data) as WebsocketBasePayload
        } catch (err) {
          consola.error(`${logPrefix} failed to decode websocket message`, err, event.data)
          return
        }

        consola.debug(`${logPrefix} received spoolman message:`, data)
        switch (data.resource) {
          case 'spool':
            store.dispatch('spoolman/onSpoolChange', data)
            break

          case 'filament':
            store.dispatch('spoolman/onFilamentChange', data)
            break

          case 'vendor':
            store.dispatch('spoolman/onVendorChange', data)
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
