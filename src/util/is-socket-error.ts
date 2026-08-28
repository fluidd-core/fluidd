import type { SocketError } from '@/store/socket/types'

const isSocketError = (value: unknown): value is SocketError => (
  value != null &&
  typeof value === 'object' &&
  'code' in value &&
  typeof value.code === 'number' &&
  'message' in value &&
  typeof value.message === 'string'
)

export default isSocketError
