import type { SocketState } from './types'

export const state = (): SocketState => {
  return {
    status: 'initializing',
    acceptingNotifications: false,
    connectionId: null
  }
}
