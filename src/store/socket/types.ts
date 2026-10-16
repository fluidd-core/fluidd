export interface SocketState {
  status: SocketStatus;
  acceptingNotifications: boolean;
  connectionId: number | null;
}

export type SocketStatus =
  | 'initializing'
  | 'disconnected'
  | 'connecting'
  | 'identifying'
  | 'authenticating'
  | 'ready'
