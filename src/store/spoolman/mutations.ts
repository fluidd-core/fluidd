import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import type {
  Spool,
  SpoolmanState,
  SpoolSelectionDialogState,
  WebsocketPayload
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
    const supported = !!payload.length // spools available

    if (supported && store.state.server.config.spoolman?.server) {
      // init websocket to listen for updates
      const spoolmanUrl = new URL(store.state.server.config.spoolman?.server)
      spoolmanUrl.pathname += `${spoolmanUrl.pathname.endsWith('/') ? '' : '/'}api/v1/spool`
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
          data = JSON.parse(event.data) as WebsocketPayload
        } catch (err) {
          consola.error(`${logPrefix} failed to decode websocket message`, err, event.data)
          return
        }

        consola.debug(`${logPrefix} received spoolman message:`, data)
        switch (data.resource) {
          case 'spool':
            store.dispatch('spoolman/onSpoolChange', data)
            break

          default:
            consola.debug(`${logPrefix} ignoring websocket message with type ${data.resource}`)
        }
      }
    } else {
      // destroy ws
      state.socket?.close()
      state.socket = undefined
    }

    state.supported = supported
    state.availableSpools = payload.map(spool => ({
      ...spool,
      registered: new Date(spool.registered),
      first_used: spool.first_used ? new Date(spool.first_used) : undefined,
      last_used: spool.last_used ? new Date(spool.last_used) : undefined
    }))
  },

  setDialogState (state, payload: SpoolSelectionDialogState) {
    state.dialog = payload
  }
}
