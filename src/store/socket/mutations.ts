import { MutationTree } from 'vuex'
import { SocketState } from './types'
import { defaultState } from './index'

export const mutations: MutationTree<SocketState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setSocketOpen (state, payload) {
    state.open = payload
    state.disconnecting = false
  },

  setSocketConnecting (state, payload) {
    state.connecting = payload
  },

  setSocketReadyState (state, payload) {
    state.ready = payload
  },

  setAcceptNotifications (state) {
    state.acceptingNotifications = true
  },

  setSocketDisconnecting (state, payload) {
    state.disconnecting = payload
  }
}
