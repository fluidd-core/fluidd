import type { GetterTree } from 'vuex'
import type { SocketState } from './types'
import type { RootState } from '../types'

export const getters = {
  /**
   * Indicates if our socket is connected / open.
   */
  getConnectionState: (state): boolean => {
    return state.open
  },

  /**
   * Indicates if our socket is attempting to connect still..
   */
  getConnectingState: (state): boolean => {
    return state.connecting
  }
} satisfies GetterTree<SocketState, RootState>
