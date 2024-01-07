import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import type {
  Spool,
  SpoolmanState,
  SpoolSelectionDialogState,
  WebsocketBasePayload
} from '@/store/spoolman/types'
import store from '@/store'
import { consola } from 'consola'

const logPrefix = '[spoolman]'

export const mutations: MutationTree<SpoolmanState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setActiveSpool (state, payload: number) {
    state.activeSpool = payload
  },

  setAvailableSpools (state, payload: Spool[]) {
    // implies working communication with spoolman server
    state.supported = !!payload.length // spools available

    state.availableSpools = payload.map(spool => ({
      ...spool,
      registered: new Date(spool.registered),
      first_used: spool.first_used ? new Date(spool.first_used) : undefined,
      last_used: spool.last_used ? new Date(spool.last_used) : undefined
    }))

    if (state.supported && store.state.server.config.spoolman?.server) {
      if (store.state.spoolman.socket?.readyState === WebSocket.OPEN) {
        // we already have a working WS conn
        return
      }

      // init websocket to listen for updates
      const spoolmanUrl = new URL(store.state.server.config.spoolman?.server)
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
  },

  setDialogState (state, payload: SpoolSelectionDialogState) {
    state.dialog = payload
  }
}
