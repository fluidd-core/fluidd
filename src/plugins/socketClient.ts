/**
 * Taken from https://github.com/DimanVorosh/vue-json-rpc-websocket/blob/master/src/wsClient.js
 * and refactored.
 */
import type _Vue from 'vue'
import { consola } from 'consola'
import { camelCase, mergeWith } from 'lodash-es'
import type { Store } from 'vuex'
import type { RootState } from '@/store/types'

const fastNotifyStatusUpdateKeys = [
  'motion_report'
] as const

const ALLOWED_RETRIES = 3
const RETRY_INTERVAL = 1000

export class WebSocketClient {
  url = ''
  connection: WebSocket | null = null
  logPrefix = '[WEBSOCKET]'
  requests: Request[] = []
  requestId = 0
  store: Store<RootState>
  cache: CachedParams | null = null
  private retryCount = 0
  private reconnectTimeout: number | null = null

  constructor (options: SocketPluginOptions) {
    this.store = options.store
  }

  close () {
    this.cancelReconnect()
    if (this.connection) {
      this.cache = null
      this.clearRequests()
      this.store.dispatch('socket/onSetStatus', 'disconnected')
      this.connection.close()
    }
  }

  connect (url?: string) {
    this.cancelReconnect()
    if (url) this.url = url
    this.retryCount = 0
    this.openSocket()
  }

  private openSocket () {
    this.cache = null
    this.clearRequests()

    try {
      this.store.dispatch('socket/onSetStatus', 'connecting')
      this.connection = new WebSocket(this.url)

      this.connection.onopen = () => {
        this.retryCount = 0
        this.store.dispatch('socket/onSetStatus', 'identifying')
      }

      this.connection.onclose = (event) => {
        consola.debug(`${this.logPrefix} Connection closed:`, event)
        this.handleClose()
      }

      this.connection.onerror = (event) => {
        consola.error(`${this.logPrefix} Connection error:`, event)
      }

      this.connection.onmessage = (message) => {
        // Parse the data packet.
        const socketResponse = JSON.parse(message.data) as SocketResponse

        if ('id' in socketResponse) {
          const requestIndex = this.requests
            .findIndex(request => request.id === socketResponse.id)

          const request = requestIndex > -1
            ? this.requests.splice(requestIndex, 1)[0]
            : undefined

          // Remove a wait if defined.
          if (request?.wait?.length) {
            this.store.commit('wait/setRemoveWait', request.wait)
          }

          if ('error' in socketResponse) { // Is it in error?
            if (request) {
              Object.defineProperty(socketResponse.error, '__request__', { enumerable: false, value: request })

              if (request.onRejected) {
                request.onRejected(socketResponse.error)
              }
            }

            consola.debug(`${this.logPrefix} Response error:`, socketResponse.error)

            this.store.dispatch('socket/onSocketError', socketResponse.error)

            return
          }

          if (request) {
            // these are specific answers to a request we've made.
            // Build the response, including a non-enumerable ref of the original request.
            const result = typeof socketResponse.result === 'string'
              ? { result: socketResponse.result }
              : socketResponse.result

            Object.defineProperty(result, '__request__', { enumerable: false, value: request })

            consola.debug(`${this.logPrefix} Response:`, result)

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
            for (const key of fastNotifyStatusUpdateKeys) {
              if (key in params) {
                this.store.dispatch('printer/onFastNotifyStatusUpdate', { key, payload: params[key] }, { root: true })
                delete params[key]
              }
            }

            const timestamp = eventtime ? eventtime * 1000 : Date.now()

            this.cache = !this.cache
              ? { timestamp, params }
              : { timestamp: this.cache.timestamp, params: mergeWith(this.cache.params, params, (dest, src) => Array.isArray(dest) ? src : undefined) }

            // If there's a second or more difference, flush the cache.
            if (timestamp - this.cache.timestamp >= 1000) {
              this.store.dispatch('socket/notifyStatusUpdate', this.cache.params)
              this.cache = { timestamp, params: {} }
            }
          }
        } else {
          // No params? Let it through.
          this.store.dispatch(`socket/${camelCase(socketResponse.method)}`)
        }
      }
    } catch (error: unknown) {
      consola.error(`${this.logPrefix} Failed to open WebSocket:`, error)
      this.handleClose()
    }
  }

  private handleClose () {
    // Explicit close(): onSetStatus('disconnected') was already dispatched; nothing to do.
    if (this.store.state.socket.status === 'disconnected') return

    // retryCount counts failed opens in a chain; ws.onopen zeroes it on any
    // successful open, so we just increment here and give up at the cap.
    this.retryCount += 1

    if (this.retryCount > ALLOWED_RETRIES) {
      this.store.dispatch('socket/onSetStatus', 'disconnected')
      return
    }

    this.store.dispatch('socket/onSetStatus', 'connecting')
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null
      this.openSocket()
    }, RETRY_INTERVAL)
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
  emit (method: string, options?: NotifyOptions) {
    return new Promise((resolve, reject) => {
      try {
        // Any non-'disconnected' state is eligible to emit; physical readiness
        // is enforced by the readyState check below.
        if (this.store.state.socket.status === 'disconnected') {
          consola.debug(`${this.logPrefix} Socket emit denied, disconnected:`, method, options)

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

          const request: Request = {
            id,
            onFulfilled: resolve,
            onRejected: reject
          }

          if (options) {
            if (options.wait) {
              request.wait = options.wait
              this.store.dispatch('wait/addWait', options.wait)
            }
            if (options.params) {
              packet.params = options.params
              request.params = options.params
            }
            request.dispatch = options.dispatch
            request.commit = options.commit
          }
          this.requests.push(request)
          this.connection.send(JSON.stringify(packet))
        } else {
          consola.debug(`${this.logPrefix} Not ready, or closed.`, method, options, this.connection?.readyState)

          throw new Error('Socket is not ready or closed')
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  clearRequests () {
    for (const request of this.requests) {
      if (request.onRejected) {
        request.onRejected(new Error('Socket disconnected'))
      }
    }

    this.requests = []
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
  store: Store<RootState>;
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
  error: string | SocketError;
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
