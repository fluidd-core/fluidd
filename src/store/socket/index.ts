import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { SocketState } from './types'
import { RootState } from '../types'

/**
 * Maintains the state of the socket(s).
 */
export const defaultState = (): SocketState => {
  return {
    apiConnected: true, //            api is connected, socket may not be.
    open: false, //                   socket is open or closed.
    connecting: false, //             socket is trying to connect.
    disconnecting: false, //          indicates we know a disconnect is coming, and to retry.
    ready: false, //                  indicates the socket is ready (and has first dump of data...)
    acceptingNotifications: false, // indicates we're accepting notification data because we've finished subscribing to objects
    error: null, //                    if the socket has an error or not
    connectionId: null //             connection id assigned to the socket
  }
}

export const state = defaultState()

const namespaced = true

export const socket: Module<SocketState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
