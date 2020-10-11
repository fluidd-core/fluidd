/* eslint-disable lines-between-class-members */
/* eslint-disable no-unused-expressions */
/* eslint-disable array-callback-return */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Taken from https://github.com/DimanVorosh/vue-json-rpc-websocket/blob/master/src/wsClient.js
 * and refactored.
 */
import _Vue from 'vue'
import { camelCase } from 'lodash-es'
import { RateLimiter } from '@/rateLimiter'

export class WebSocketClient {
  url = '';
  connection: WebSocket | null = null;
  reconnectEnabled = false;
  reconnectInterval = 3000;
  allowedReconnectAttempts = 3;
  reconnectCount = 0;
  logPrefix = '[WEBSOCKET]';
  requests: Array<Request> = [];
  store: any | null = null;
  // limiter: RateLimiter
  limitedDispatch: any

  constructor (options: Options) {
    this.url = options.url
    this.reconnectEnabled = options.reconnectEnabled || false
    this.reconnectInterval = options.reconnectInterval || 3000
    this.store = options.store ? options.store : null

    const limiter = new RateLimiter(1000)
    this.limitedDispatch = limiter.create(this.store.dispatch, 1000)
  }

  connect () {
    this.connection = new WebSocket(this.url)
    if (this.store) this.store.dispatch('socket/onSocketConnecting', true)

    this.connection.onopen = (e) => {
      if (this.reconnectEnabled) {
        this.reconnectCount = 1
      }
      if (this.store) {
        this.store.dispatch('socket/onSocketOpen', e)
        this.store.dispatch('socket/onSocketConnecting', false)
      }
    }

    this.connection.onclose = (e) => {
      console.debug(`${this.logPrefix} Connection closed:`, e)
      if (this.store) this.store.dispatch('socket/onSocketClose', e)
      if (!e.wasClean && this.reconnectEnabled) {
        this.reconnect()
      } else {
        if (this.store) this.store.dispatch('socket/onSocketConnecting', false)
      }
    }

    this.connection.onerror = (e) => {
      console.error(`${this.logPrefix} Connection error:`, e)
      if (this.store) this.store.dispatch('socket/onSocketError', e)
      // if (this.connection) this.connection.close();
    }

    this.connection.onmessage = (m) => {
      const d: SocketResponse = JSON.parse(m.data)

      // Is this a socket notification, or an answer to a specific request?
      const request = this.requests.find(request => request.id === d.id)

      if (d.error) { // Is it in error?
        if (request) {
          Object.defineProperty(d.error, '__request__', { enumerable: false, value: request })
        }
        console.debug(`${this.logPrefix} Response error:`, d.error)
        this.store.dispatch('socket/onSocketError', d.error)
        return
      }

      if (request) {
        // these are specific answers to a request we've made.
        // Build the response, including a non-enumerable ref of the original request.
        let result = (d.result) ? d.result : d.params
        if (typeof result === 'string') {
          result = { result }
        }

        Object.defineProperty(result, '__request__', { enumerable: false, value: request })
        console.debug(`${this.logPrefix} Response:`, result)
        if (request.action) this.store?.dispatch(request.action, result)
      } else {
        // These are socket notifications (i.e., no specific request was made..)
        // Dispatch with the name of the method, converted to camelCase.
        // console.debug(`${this.logPrefix} Response:`, d) // TODO: add a proper logger to turn these on.

        // Moonraker sends an update every 250ms, for any object subscribed.
        // So - we cache them using a basic cached rate limiter.
        if (d.params && d.params[0]) {
          this.limitedDispatch('socket/' + camelCase(d.method), d.params[0])
          // this.store.dispatch('socket/' + camelCase(d.method), d.params[0])
        } else {
          // No need to cache this, as it passes no params.
          this.store.dispatch('socket/' + camelCase(d.method))
        }
      }
    }
  }

  reconnect () {
    if (this.reconnectCount <= this.allowedReconnectAttempts) {
      this.reconnectCount += 1
      this.connection = null
      console.debug(`${this.logPrefix} Reconnecting in ${this.reconnectInterval}`)
      setTimeout(() => {
        this.connect()
      }, this.reconnectInterval)
    } else {
      if (this.store) this.store.dispatch('socket/onSocketConnecting', false)
    }
  }

  /**
   * Sends data TO the socket
   * @param method
   * @param params
   */
  emit (method: string, options?: NotifyOptions) {
    if (this.connection?.readyState === WebSocket.OPEN) {
      // moonraker expects a unique id for us to reference back to when data is returned.
      const id = Math.floor(Math.random() * Math.floor(10000))
      const packet: SocketRequest = {
        id,
        method,
        jsonrpc: '2.0'
      }
      const request: Request = {
        id,
        action: method
      }
      if (options && options.wait) {
        request.wait = options.wait
      }
      if (options && options.params) {
        packet.params = options.params
        request.params = options.params
      }
      if (options && options.action) request.action = options.action
      this.requests.push(request)
      this.connection.send(JSON.stringify(packet))
    } else {
      console.debug(`${this.logPrefix} Not ready.`)
    }
  }
}

export const SocketPlugin = {
  install (Vue: typeof _Vue, options?: any) {
    const socket = new WebSocketClient(options)
    socket.connect()
    Vue.prototype.$socket = socket
    Vue.$socket = socket
  }
}
declare module 'vue/types/vue' {
  interface Vue {
    $socket: SocketClient;
  }

  interface VueConstructor {
    $socket: SocketClient;
  }
}
declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
      $socket?: SocketClient;
  }
}

interface SocketClient {
  connect(): void;
  emit(method: string, options?: NotifyOptions): void;
}

interface Options {
  url: string;
  reconnectEnabled?: boolean;
  reconnectInterval?: number;
  store: any;
}

interface NotifyOptions {
  params?: any;
  action?: any;
  wait?: string;
}

interface Request {
  id: number;
  action: string;
  params?: any;
  wait?: string;
}

interface SocketRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params?: object;
}

interface SocketResponse {
  jsonrpc: string; // always available
  method?: string; // generic responses
  params?: Array<object>; // generic responses
  id?: number; // specific response
  result?: object; // specific response
  error?: string | SocketError; // specific response
}

interface SocketError {
  code: number;
  message: string;
}
