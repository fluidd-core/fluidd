export type SocketStatus =
  | 'disconnected'
  | 'connecting'
  | 'identifying'
  | 'authenticating'
  | 'ready'

export interface SocketState {
  status: SocketStatus;
  acceptingNotifications: boolean;
  error: SocketError | null;
  connectionId: string | null;
}

export interface SocketError {
  code: number;
  message: string;
}
