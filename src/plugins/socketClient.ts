import type _Vue from 'vue'
import { consola } from 'consola'
import { camelCase, mergeWith } from 'lodash-es'
import type { TypedStore } from '@/store'

const LOG_PREFIX = '[WEBSOCKET]'

const ALLOWED_RETRIES = 3
const EXPONENTIAL_BACKOFF = 1.4

const FAST_NOTIFY_KEYS = [
  'motion_report'
] as const

export class WebSocketClient {
  private connection: WebSocket | null = null
  private requests = new Map<number, Request>()
  private requestId = 0
  private store: TypedStore
  private cache: CachedParams | null = null
  private retryCount = 0
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null

  constructor (options: SocketPluginOptions) {
    this.store = options.store
  }

  close () {
    this.cancelReconnect()
    if (this.connection) {
      this.clearCacheAndRequests()
      this.connection.onopen = null
      this.connection.onmessage = null
      this.connection.onerror = null
      this.connection.onclose = null
      this.connection.close()
    }
  }

  connect () {
    this.cancelReconnect()
    this.retryCount = 0
    this.openSocket()
  }

  private openSocket () {
    this.clearCacheAndRequests()

    try {
      const url = this.store.state.config.socketUrl

      if (!url) {
        this.store.typedDispatch('socket/onSetStatus', 'disconnected')
        return
      }

      this.store.typedDispatch('socket/onSetStatus', 'connecting')
      this.connection = new WebSocket(url)

      this.connection.onopen = () => {
        this.retryCount = 0
        this.store.typedDispatch('socket/onSetStatus', 'identifying')
      }

      this.connection.onclose = (event) => {
        consola.debug(`${LOG_PREFIX} Connection closed:`, event)
        this.handleClose()
      }

      this.connection.onerror = (event) => {
        consola.error(`${LOG_PREFIX} Connection error:`, event)
      }

      this.connection.onmessage = async (message) => {
        // Parse the data packet.
        const socketResponse = JSON.parse(message.data) as SocketResponse

        if ('id' in socketResponse) {
          const request = this.requests.get(socketResponse.id)

          this.requests.delete(socketResponse.id)

          // Remove a wait if defined.
          if (request?.wait?.length) {
            this.store.typedCommit('wait/setRemoveWait', request.wait)
          }

          if ('error' in socketResponse) { // Is it in error?
            if (request) {
              Object.defineProperty(socketResponse.error, '__request__', { enumerable: false, value: request })

              if (request.onRejected) {
                request.onRejected(socketResponse.error)
              }
            }

            consola.debug(`${LOG_PREFIX} Response error:`, socketResponse.error)

            this.store.typedDispatch('socket/onSocketError', socketResponse.error)

            return
          }

          if (request) {
            // these are specific answers to a request we've made.
            // Build the response, including a non-enumerable ref of the original request.
            const result = typeof socketResponse.result === 'string'
              ? { result: socketResponse.result }
              : socketResponse.result

            Object.defineProperty(result, '__request__', { enumerable: false, value: request })

            consola.debug(`${LOG_PREFIX} Response:`, result)

            if (request.dispatch) {
              this.store.dispatch(request.dispatch, result)
            }

            if (request.commit) {
              this.store.commit(request.commit, result)
            }

            if (request.onFulfilled) {
              request.onFulfilled(socketResponse.result)
            }
          }

          return
        }

        // These are socket notifications (i.e., no specific request was made..)
        // Dispatch with the name of the method, converted to camelCase.
        if (socketResponse.params?.[0]) {
          const [params, eventtime] = socketResponse.params

          if (socketResponse.method !== 'notify_status_update') {
            // Normally, we let notifications through with no cache...
            this.store.dispatch(`socket/${camelCase(socketResponse.method)}`, params)
          } else {
            // ...However, status notifications come through thick and fast,
            // so we cache these and send them through every second.

            // If any of these properties exist, bypass the cache and send immediately
            for (const key of FAST_NOTIFY_KEYS) {
              if (key in params) {
                this.store.typedDispatch('printer/onFastNotifyStatusUpdate', { key, payload: params[key] }, { root: true })
                delete params[key]
              }
            }

            const timestamp = eventtime ? eventtime * 1000 : Date.now()

            this.cache = !this.cache
              ? { timestamp, params }
              : { timestamp: this.cache.timestamp, params: mergeWith(this.cache.params, params, (dest, src) => Array.isArray(dest) ? src : undefined) }

            // If there's a second or more difference, flush the cache.
            if (timestamp - this.cache.timestamp >= 1000) {
              this.store.typedDispatch('socket/notifyStatusUpdate', this.cache.params)
              this.cache = { timestamp, params: {} }
            }
          }
        } else {
          // No params? Let it through.
          this.store.dispatch(`socket/${camelCase(socketResponse.method)}`)
        }
      }
    } catch (error: unknown) {
      consola.error(`${LOG_PREFIX} Failed to open WebSocket:`, error)
      this.handleClose()
    }
  }

  private handleClose () {
    // If the socket is already marked disconnected, there is nothing left to do.
    if (this.store.state.socket.status === 'disconnected') return

    // retryCount counts failed opens in a chain; ws.onopen zeroes it on any
    // successful open, so we just increment here and give up at the cap.
    this.retryCount += 1

    if (this.retryCount > ALLOWED_RETRIES) {
      this.store.typedDispatch('socket/onSetStatus', 'disconnected')
      this.clearCacheAndRequests()
      this.connection = null
      return
    }

    this.store.typedDispatch('socket/onSetStatus', 'connecting')
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null
      this.openSocket()
    }, EXPONENTIAL_BACKOFF ** this.retryCount * 1000)
  }

  private cancelReconnect () {
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  /**
   * Sends data TO the socket
   * @param method
   * @param params
   */
  emit (method: string, options: NotifyOptions = {}) {
    return new Promise((resolve, reject) => {
      try {
        const { wait, params, dispatch, commit } = options

        // Any non-'disconnected' state is eligible to emit; physical readiness
        // is enforced by the readyState check below.
        if (this.store.state.socket.status === 'disconnected') {
          consola.debug(`${LOG_PREFIX} Socket emit denied, disconnected:`, method, options)

          throw new Error('Socket is disconnected')
        }

        if (this.connection?.readyState === WebSocket.OPEN) {
          this.requestId = (this.requestId + 1) % 90_000

          const id = this.requestId + 10_000

          const packet: SocketRequest = {
            id,
            method,
            jsonrpc: '2.0'
          }

          if (params) {
            packet.params = params
          }

          const request: Request = {
            id,
            dispatch,
            commit,
            params,
            wait,
            onFulfilled: resolve,
            onRejected: reject
          }

          if (wait) {
            this.store.typedDispatch('wait/addWait', wait)
          }

          this.requests.set(id, request)
          this.connection.send(JSON.stringify(packet))
        } else {
          consola.debug(`${LOG_PREFIX} Not ready, or closed.`, method, options, this.connection?.readyState)

          throw new Error('Socket is not ready or closed')
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  clearCacheAndRequests () {
    this.cache = null

    for (const request of this.requests.values()) {
      if (request.onRejected) {
        request.onRejected(new Error('Socket disconnected'))
      }
    }

    this.requests.clear()
  }
}

export const SocketPlugin = {
  install (Vue: typeof _Vue, options?: SocketPluginOptions) {
    if (options?.store == null) {
      throw new Error('options required')
    }

    const socket = new WebSocketClient(options)
    Vue.prototype.$socket = socket
    Vue.$socket = socket
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $socket: WebSocketClient;
  }

  interface VueConstructor {
    $socket: WebSocketClient;
  }
}

interface SocketPluginOptions {
  store: TypedStore;
}

export interface NotifyOptions {
  params?: Record<string, any>;
  dispatch?: string;
  commit?: string;
  wait?: string;
}

interface Request {
  id: number;
  dispatch?: string;
  commit?: string;
  params?: Record<string, any>;
  wait?: string;
  onFulfilled: (value: unknown) => void;
  onRejected: (reason?: unknown) => void;
}

export type ObjectWithRequest<T> = T & {
  __request__: Request
}

interface SocketRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params?: Record<string, any>;
}

interface SocketResponseBase {
  jsonrpc: string; // always available
}

interface SocketApiResponse extends SocketResponseBase {
  id: number;
  result: string | Record<string, any>;
}

interface SocketApiErrorResponse extends SocketResponseBase {
  id: number;
  error: SocketError;
}

interface SocketNotificationResponse extends SocketResponseBase {
  method: string;
  params?: [Record<string, any>, number];
}

type SocketResponse = SocketApiResponse | SocketApiErrorResponse | SocketNotificationResponse

interface SocketError {
  code: number;
  message: string;
}

interface CachedParams {
  timestamp: number;
  params: Record<string, any>;
}
