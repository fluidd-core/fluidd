export interface SocketError {
  code: number;
  message: string;
}

export const JsonRpcErrorCode = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
} as const

export const isSocketError = (value: unknown): value is SocketError => (
  value != null &&
  typeof value === 'object' &&
  'code' in value &&
  typeof value.code === 'number' &&
  'message' in value &&
  typeof value.message === 'string'
)

// Moonraker's JSON-RPC layer maps a 404 to MethodNotFound and a 401 to InvalidParams
export const isMoonrakerUnauthorizedError = (error: SocketError): boolean => (
  error.code === JsonRpcErrorCode.InvalidParams
)

// Also matches a method missing on an old Moonraker
export const isMoonrakerNotFoundError = (error: SocketError): boolean => (
  error.code === JsonRpcErrorCode.MethodNotFound
)
