import type { GetterTree } from 'vuex'
import type { SocketState } from './types'
import type { RootState } from '../types'

export const getters = {
  getIsConnected: (state): boolean => (
    state.status !== 'disconnected'
  ),

  getIsConnecting: (state): boolean => (
    state.status === 'connecting' ||
    state.status === 'identifying'
  ),

  getIsAuthenticating: (state): boolean => (
    state.status === 'authenticating'
  ),

  getIsReady: (state): boolean => (
    state.status === 'ready'
  )
} satisfies GetterTree<SocketState, RootState>
