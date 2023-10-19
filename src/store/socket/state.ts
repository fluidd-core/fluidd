import type { SocketState } from './types'

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
