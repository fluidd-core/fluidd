/* eslint-disable lines-between-class-members */
/* eslint-disable no-unused-expressions */
/* eslint-disable array-callback-return */

/**
 * Taken from https://github.com/DimanVorosh/vue-json-rpc-websocket/blob/master/src/wsClient.js
 * and refactored.
 */
import _Vue from 'vue'
import { Globals } from '@/globals'
import consola from 'consola'
import { camelCase } from 'lodash'
import { authApi } from '@/api/auth.api'

export class WebSocketClient {
  url = '';
  connection: WebSocket | null = null;
  reconnectEnabled = false;
  reconnectInterval = 1000;
  allowedReconnectAttempts = 3;
  reconnectCount = 0;
  logPrefix = '[WEBSOCKET]';
  requests: Array<Request> = [];
  store: any | null = null;
  pingTimeout: any;

  constructor (options: Options) {
    this.url = options.url
    this.reconnectEnabled = options.reconnectEnabled || false
    this.reconnectInterval = options.reconnectInterval || 1000
    this.store = options.store ? options.store : null
  }

  pong () {
    // Valid response from the socket.
    clearTimeout(this.pingTimeout)

    // We have a connection again, so set the socket properties
    // appropriately.
    if (
      !this.store.state.socket?.disconnecting && // We arent about to disonnect and..
      !this.store.state.files.download // We're not in the middle of a download.
    ) {
      this.store.commit('socket/setSocketOpen', true)
      this.store.dispatch('socket/onSocketConnecting', false)
    }

    this.pingTimeout = setTimeout(() => {
      if (
        !this.store.state.socket?.disconnecting && // We arent about to disonnect and..
        !this.store.state.files.download // We're not in the middle of a download.
      ) {
        // In the event our socket stops responding, set the socket properties
        // appropriately.
        consola.debug(`${this.logPrefix} Connection timeout, pong failed`)
        if (this.store) this.store.commit('socket/setSocketOpen', false)
        if (this.store) this.store.dispatch('socket/onSocketConnecting', true)
      }
    }, Globals.SOCKET_PING_INTERVAL)
  }

  close () {
    if (this.connection) {
      this.connection.close()
      this.reconnectCount = 0
    }
  }

  async connect (url?: string) {
    if (url) this.url = url

    await authApi.getOneShot()
      .then(response => response.data.result)
      .then((token) => {
        // Good. Move on with setting up the socket.
        if (this.store) this.store.dispatch('socket/onSocketConnecting', true)
        this.connection = new WebSocket(`${this.url}?token=${token}`)

        this.connection.onopen = () => {
          if (this.reconnectEnabled) {
            this.reconnectCount = 1
          }
          if (this.store) {
            this.store.dispatch('socket/onSocketConnecting', false)
            this.store.dispatch('socket/onSocketOpen', true)
          }
        }

        this.connection.onclose = (e) => {
          consola.debug(`${this.logPrefix} Connection closed:`, e)
          clearTimeout(this.pingTimeout)
          if (this.store) this.store.dispatch('socket/onSocketClose', e)
          if (!e.wasClean) {
            this.reconnect()
          }
        }

        this.connection.onerror = (e) => {
          consola.error(`${this.logPrefix} Connection error:`, e)
          if (this.store) this.store.dispatch('socket/onSocketError', e)
        }

        this.connection.onmessage = (m) => {
          // Parse the data packet.
          const d: SocketResponse = JSON.parse(m.data)

          // Is this a socket notification, or an answer to a specific request?
          let request: Request | undefined
          const requestIndex = this.requests.findIndex(request => request.id === d.id)
          if (requestIndex > -1) {
            request = this.requests[requestIndex]
            this.requests.splice(requestIndex, 1)
          }

          // Remove a wait if defined.
          if (this.store && request && request.wait && request.wait.length) {
            this.store.commit('wait/setRemoveWait', request.wait)
          }

          if (d.error) { // Is it in error?
            if (request) {
              Object.defineProperty(d.error, '__request__', { enumerable: false, value: request })
            }
            consola.debug(`${this.logPrefix} Response error:`, d.error)
            if (this.store) this.store.dispatch('socket/onSocketError', d.error)
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
            consola.debug(`${this.logPrefix} Response:`, result)
            if (request.dispatch && this.store) this.store?.dispatch(request.dispatch, result)
            if (request.commit && this.store) this.store?.commit(request.commit, result)
          } else {
            // These are socket notifications (i.e., no specific request was made..)
            // Dispatch with the name of the method, converted to camelCase.
            // consola.debug(`${this.logPrefix} Response:`, d) // TODO: add a proper logger to turn these on.

            // we're still alive.
            this.pong()

            if (d.params && d.params[0]) {
              if (this.store) this.store.dispatch('socket/' + camelCase(d.method), d.params[0])
            } else {
              if (this.store) this.store.dispatch('socket/' + camelCase(d.method))
            }
          }
        }
      })
      .catch((err) => {
        // Bad. If this is a 401, then don't retry. Otherwise do.
        if (err.response?.status !== 401) this.reconnect()
      })
  }

  reconnect () {
    if (this.reconnectCount <= this.allowedReconnectAttempts) {
      this.reconnectCount += 1
      this.connection = null
      consola.debug(`${this.logPrefix} Reconnecting in ${this.reconnectInterval}`)
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
      const getRandomNumber = (min: number, max: number) => {
        return Math.floor(Math.random() * (max - min + 1)) + min
      }
      const id = getRandomNumber(10000, 99999)
      const packet: SocketRequest = {
        id,
        method,
        jsonrpc: '2.0'
      }
      const request: Request = {
        id
      }
      if (options && options.wait) {
        request.wait = options.wait
        if (this.store) this.store.dispatch('wait/addWait', options.wait)
      }
      if (options && options.params) {
        packet.params = options.params
        request.params = options.params
      }
      if (options && options.dispatch) request.dispatch = options.dispatch
      if (options && options.commit) request.commit = options.commit
      this.requests.push(request)
      this.connection.send(JSON.stringify(packet))
    } else {
      consola.debug(`${this.logPrefix} Not ready, or closed.`, method, options)
    }
  }
}

export const SocketPlugin = {
  install (Vue: typeof _Vue, options?: any) {
    const socket = new WebSocketClient(options)
    // socket.connect()
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
  connect(url?: string): void;
  close(): void;
  emit(method: string, options?: NotifyOptions): void;
}

interface Options {
  url: string;
  token?: string;
  reconnectEnabled?: boolean;
  reconnectInterval?: number;
  store: any;
}

export interface NotifyOptions {
  params?: any;
  dispatch?: string;
  commit?: string;
  wait?: string;
}

interface Request {
  id: number;
  dispatch?: string;
  commit?: string;
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
