export interface SocketState {
  apiConnected: boolean;
  open: boolean;
  connecting: boolean;
  disconnecting: boolean;
  ready: boolean;
  acceptingNotifications: boolean;
  error: SocketError | null;
  connectionId: string | null;
}

export interface SocketError {
  code: number;
  message: string;
}
