import type { MutationTree } from 'vuex'
import type { SocketState } from './types'
import { defaultState } from './state'

export const mutations: MutationTree<SocketState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setSocketOpen (state, payload) {
    if (state.open !== payload) state.open = payload
    if (state.disconnecting) state.disconnecting = false
  },

  setSocketConnecting (state, payload) {
    if (state.connecting !== payload) state.connecting = payload
  },

  setSocketReadyState (state, payload) {
    state.ready = payload
  },

  setAcceptNotifications (state, payload) {
    state.acceptingNotifications = payload
  },

  setSocketDisconnecting (state, payload) {
    state.disconnecting = payload
  },

  setApiConnected (state, payload) {
    state.apiConnected = payload
  },

  setConnectionId (state, payload) {
    state.connectionId = payload
  }
}
