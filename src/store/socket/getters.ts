import type { GetterTree } from 'vuex'
import type { SocketState, SocketStatus } from './types'
import type { RootState } from '../types'

export const getters = {
  getStatus: (state): SocketStatus => state.status,

  getIsReady: (state): boolean => state.status === 'ready',

  getIsConnected: (state): boolean => state.status !== 'disconnected'
} satisfies GetterTree<SocketState, RootState>
