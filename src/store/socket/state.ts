import type { SocketState } from './types'

export const createState = (): SocketState => {
  return {
    status: 'initializing',
    acceptingNotifications: false,
    connectionId: null
  }
}
