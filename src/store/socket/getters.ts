import type { GetterTree } from 'vuex'
import type { SocketState } from './types'
import type { RootState } from '../types'

export const getters = {
  getIsInitializing: (state): boolean => (
    state.status === 'initializing'
  ),

  getIsDisconnected: (state): boolean => (
    state.status === 'disconnected'
  ),

  getIsConnected: (state): boolean => (
    state.status === 'connecting' ||
    state.status === 'identifying' ||
    state.status === 'authenticating' ||
    state.status === 'ready'
  ),

  getIsAuthenticating: (state): boolean => (
    state.status === 'authenticating'
  ),

  getIsReady: (state): boolean => (
    state.status === 'ready'
  )
} satisfies GetterTree<SocketState, RootState>
