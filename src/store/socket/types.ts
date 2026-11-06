export interface SocketState {
  status: SocketStatus;
  acceptingNotifications: boolean;
  connectionId: number | null;
  retry: SocketRetry | null;
  stalled: boolean;
}

export type SocketRetry =
  | { at: number }
  | { held: true }

export type SocketStatus =
  | 'initializing'
  | 'disconnected'
  | 'connecting'
  | 'identifying'
  | 'authenticating'
  | 'ready'
