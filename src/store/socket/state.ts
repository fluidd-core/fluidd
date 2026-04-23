import type { SocketState } from './types'

export const defaultState = (): SocketState => {
  return {
    status: 'initializing',
    acceptingNotifications: false,
    error: null,
    connectionId: null
  }
}

export const state = defaultState()
