export interface SocketState {
  status: SocketStatus;
  acceptingNotifications: boolean;
  connectionId: number | null;
  retryAt: number | null;
  stalled: boolean;
}

export type SocketStatus =
  | 'initializing'
  | 'disconnected'
  | 'connecting'
  | 'identifying'
  | 'authenticating'
  | 'ready'
