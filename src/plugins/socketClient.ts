import type _Vue from 'vue'
import { consola } from 'consola'
import { camelCase, mergeWith } from 'lodash-es'
import type { TypedStore } from '@/store'
import type { SocketError } from '@/util/is-socket-error'

const LOG_PREFIX = '[WEBSOCKET]'

const RETRY_MIN = 1000
const RETRY_MAX = 30_000
const RETRY_JITTER = 0.2

const PING_AFTER = 10_000
const DEAD_AFTER = 20_000

const FAST_NOTIFY_KEYS = [
  'motion_report'
] as const

const retryDelay = (attempt: number): number => {
  const base = RETRY_MIN * 2 ** Math.min(attempt, 16)

  return Math.min(RETRY_MAX, Math.round(base * (1 + RETRY_JITTER * (2 * Math.random() - 1))))
}

// A 5xx is never suppressible — a 503 drives klippy recovery in socket/onSocketError.
const shouldSuppressError = (
  error: SocketError,
  suppressError: SuppressError | undefined
): boolean => {
  if (error.code >= 500) {
    return false
  }

  if (typeof suppressError !== 'function') {
    return suppressError === true
  }

  try {
    return suppressError(error)
  } catch (predicateError) {
    consola.error(`${LOG_PREFIX} suppressError predicate threw`, predicateError)

    return false
  }
}

export class WebSocketClient {
  private connection: WebSocket | null = null
  private requests = new Map<number, Request>()
  private requestId = 0
  private store: TypedStore
  private cache: CachedParams | null = null
  private retryCount = 0
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private silenceTimeout: ReturnType<typeof setTimeout> | null = null

  constructor (options: SocketPluginOptions) {
    this.store = options.store
  }

  close () {
    this.clearReconnectTimer()

    this.clearSilenceTimer()

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
    this.clearReconnectTimer()

    this.retryCount = 0

    this.openSocket()
  }

  retryNow () {
    if (this.reconnectTimeout !== null) {
      this.connect()
    }
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
      const connection = new WebSocket(url)
      this.connection = connection

      this.armDeadTimer()

      connection.onopen = () => {
        if (this.connection !== connection) return

        this.retryCount = 0
        this.armPingTimer()
        this.store.typedDispatch('socket/onSetStatus', 'identifying')
      }

      connection.onclose = (event) => {
        if (this.connection !== connection) return

        consola.debug(`${LOG_PREFIX} Connection closed:`, event)
        this.handleClose()
      }

      connection.onerror = (event) => {
        if (this.connection !== connection) return

        consola.error(`${LOG_PREFIX} Connection error:`, event)
      }

      connection.onmessage = async (message) => {
        if (this.connection !== connection) return

        this.armPingTimer()

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

            if (!shouldSuppressError(socketResponse.error, request?.suppressError)) {
              this.store.typedDispatch('socket/onSocketError', socketResponse.error)
            }

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

            if (request.onFulfilled) {
              // Unchecked: trusted to match the method's result
              request.onFulfilled(socketResponse.result)
            }
          }

          return
        }

        // These are socket notifications (i.e., no specific request was made..)
        if (socketResponse.method !== 'notify_status_update') {
          // Normally, we let notifications through with no cache...
          this.store.dispatch(`socket/${camelCase(socketResponse.method)}`, socketResponse.params?.[0])
        } else {
          // ...However, status notifications come through thick and fast,
          // so we cache these and send them through every second.
          const [params, eventtime] = socketResponse.params

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
      }
    } catch (error: unknown) {
      consola.error(`${LOG_PREFIX} Failed to open WebSocket:`, error)
      this.handleClose()
    }
  }

  private handleClose () {
    // If the socket is already marked disconnected, there is nothing left to do.
    if (this.store.state.socket.status === 'disconnected') return

    this.clearSilenceTimer()
    this.clearCacheAndRequests()
    this.connection = null

    this.store.typedDispatch('socket/onSetStatus', 'connecting')

    const delay = retryDelay(this.retryCount)

    this.retryCount += 1

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null
      this.openSocket()
    }, delay)
  }

  private clearReconnectTimer () {
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  private armPingTimer () {
    this.clearSilenceTimer()

    // Unauthenticated sockets get no notifications
    this.silenceTimeout = setTimeout(() => {
      consola.debug(`${LOG_PREFIX} No message for ${PING_AFTER} ms`)
      this.emit('server.info', { suppressError: true })
        .catch(() => {})
      this.armDeadTimer()
    }, PING_AFTER)
  }

  private armDeadTimer () {
    this.clearSilenceTimer()

    this.silenceTimeout = setTimeout(() => {
      this.silenceTimeout = null

      const connection = this.connection

      consola.debug(`${LOG_PREFIX} No response for ${DEAD_AFTER} ms, replacing the connection`)
      this.handleClose()
      connection?.close()
    }, DEAD_AFTER)
  }

  private clearSilenceTimer () {
    if (this.silenceTimeout !== null) {
      clearTimeout(this.silenceTimeout)
      this.silenceTimeout = null
    }
  }

  /**
   * Sends data TO the socket
   */
  emit<
    M extends Moonraker.Method,
    R extends Moonraker.MethodResult<M> = Moonraker.MethodResult<M>
  > (method: M, options: EmitOptions<M>) {
    return new Promise<R>((resolve, reject) => {
      try {
        const { wait, params, dispatch, suppressError } = options

        // Any non-'disconnected' state is eligible to emit; physical readiness
        // is enforced by the readyState check below.
        if (this.store.state.socket.status === 'disconnected') {
          consola.debug(`${LOG_PREFIX} Socket emit denied, disconnected:`, method, options)

          throw new Error('Socket is disconnected')
        }

        if (this.connection?.readyState === WebSocket.OPEN) {
          this.requestId = (this.requestId + 1) % 90_000

          const id = this.requestId + 10_000

          const packet: SocketRequest<M> = {
            id,
            method,
            jsonrpc: '2.0'
          }

          if (params) {
            packet.params = params
          }

          const request: Request<EmitOptions<M>['params'], R> = {
            id,
            dispatch,
            params,
            wait,
            suppressError,
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

    window.addEventListener('online', () => socket.retryNow())

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        socket.retryNow()
      }
    })
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

export type SuppressError = boolean | ((error: SocketError) => boolean)

export interface RequestOptions {
  dispatch?: string;
  wait?: string;
  suppressError?: SuppressError;
}

// skipLibCheck hides .d.ts errors, so validate the Methods shape here
type AssertMethods<T extends Record<keyof T, { params: unknown, result: unknown }>> = T
export type CheckedMethods = AssertMethods<Moonraker.Methods>

type AssertNotifications<T extends Record<keyof T, [unknown, ...unknown[]] | undefined>> = T
export type CheckedNotifications = AssertNotifications<Moonraker.Notifications>

type RequestParams<M extends Moonraker.Method> = object extends Moonraker.MethodParams<M>
  ? Moonraker.MethodParams<M> | undefined
  : Moonraker.MethodParams<M>

export type EmitOptions<M extends Moonraker.Method> = RequestOptions & (
  undefined extends RequestParams<M>
    ? { params?: RequestParams<M> }
    : { params: RequestParams<M> }
)

interface Request<P = unknown, R = unknown> {
  id: number;
  dispatch?: string;
  params: P;
  wait?: string;
  suppressError?: SuppressError;
  // Method syntax (bivariant) so any Request<P, R> fits in `requests`
  onFulfilled (value: R): void;
  onRejected: (reason?: unknown) => void;
}

// String results are dispatched as `{ result }`
type DispatchedResult<R> = R extends string ? { result: R } : R

export type ObjectWithRequest<M extends Moonraker.Method> = DispatchedResult<Moonraker.MethodResult<M>> & {
  __request__: Request<RequestParams<M>, Moonraker.MethodResult<M>>
}

interface SocketRequest<M extends Moonraker.Method> {
  jsonrpc: '2.0';
  id: number;
  method: M;
  params?: RequestParams<M>;
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

type SocketNotificationResponse = {
  [N in Moonraker.Notification]: SocketResponseBase & {
    method: N;
    params: Moonraker.Notifications[N];
  }
}[Moonraker.Notification]

type SocketResponse = SocketApiResponse | SocketApiErrorResponse | SocketNotificationResponse

interface CachedParams {
  timestamp: number;
  params: Record<string, any>;
}
