/* eslint-disable lines-between-class-members */
/* eslint-disable no-unused-expressions */
/* eslint-disable array-callback-return */

/**
 * Taken from https://github.com/DimanVorosh/vue-json-rpc-websocket/blob/master/src/wsClient.js
 * and refactored.
 */
import _Vue from 'vue'
import { Globals } from '@/globals'
import { consola } from 'consola'
import { camelCase, mergeWith } from 'lodash-es'
import { httpClientActions } from '@/api/httpClientActions'
import type { Store } from 'vuex'
import type { RootState } from '@/store/types'
import {
  PRINTER_SOCKET_OPEN,
  type PrinterSocket
} from '@/services/managed-transport'
import axios from 'axios'

/** The longest wait between two tries to reconnect. */
const MAX_RECONNECT_DELAY_MS = 30_000

/** How long the one-shot token request may take before the try counts as failed. */
const TOKEN_TIMEOUT_MS = 5_000

export class WebSocketClient {
  url = ''
  connection: PrinterSocket | null = null
  reconnectEnabled = false
  /** The first retry's wait. Each failed try doubles it, up to MAX_RECONNECT_DELAY_MS. */
  reconnectInterval = 1000
  /** Tries since the last connection opened. Fluidd never gives up on its own. */
  reconnectCount = 0
  logPrefix = '[WEBSOCKET]'
  requests: Array<Request> = []
  store: any | null = null
  pingTimeout: any
  deadTimeout: any
  cache: CachedParams | null = null
  private readonly openedConnections = new WeakSet<object>()
  private transportReconnect: (() => Promise<PrinterSocket>) | null = null
  /** Set while Fluidd closes the socket itself, so that close is not retried. */
  private closing = false
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private retryAction: (() => void) | null = null
  /** When the waiting retry runs (Date.now() ms), or null when none is waiting. */
  private retryAt: number | null = null
  /**
   * Counts every connect, close and adopted socket. A connect still waiting
   * for its token when another printer's socket was adopted or Fluidd closed
   * the connection must not open a socket to its old address afterwards.
   */
  private attempt = 0

  constructor (options: SocketPluginOptions) {
    this.url = options.url
    this.reconnectEnabled = options.reconnectEnabled || false
    this.reconnectInterval = options.reconnectInterval || 1000
    this.store = options.store ? options.store : null
    // A network or a tab coming back is the best moment to try again: don't
    // wait out the backoff.
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.retryNow())
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') this.retryNow()
      })
    }
  }

  /**
   * Called on every message. A quiet socket is not a closed one: after
   * SOCKET_PING_INTERVAL with no message the page says it is waiting, and
   * keeps the dashboard. Only after SOCKET_DEAD_AFTER is the connection given
   * up and replaced. Moonraker sends something every second, so silence that
   * long means the path is gone.
   */
  pong () {
    if (
      !this.store.state.socket.disconnecting && // We arent about to disonnect and..
      !this.store.state.files.download // We're not in the middle of a download.
    ) {
      this.store.commit('socket/setSocketOpen', true)
      if (this.store.state.socket.stalled) this.store.commit('socket/setSocketStalled', false)
      this.store.dispatch('socket/onSocketConnecting', false)
    }
    this.armSilenceTimers()
  }

  /** Starts the clocks that notice a connection has gone quiet, from now. */
  private armSilenceTimers () {
    clearTimeout(this.pingTimeout)
    clearTimeout(this.deadTimeout)
    const connection = this.connection
    this.pingTimeout = setTimeout(() => {
      if (this.quietIsExpected()) return
      consola.debug(`${this.logPrefix} No message for ${Globals.SOCKET_PING_INTERVAL} ms`)
      if (this.store) this.store.commit('socket/setSocketStalled', true)
    }, Globals.SOCKET_PING_INTERVAL)
    this.deadTimeout = setTimeout(() => {
      if (!connection || this.connection !== connection) return
      // Quiet was expected (a download, a restart Fluidd asked for): look
      // again later rather than stop looking, or a socket that dies in the
      // meantime is never replaced.
      if (this.quietIsExpected()) {
        this.armSilenceTimers()
        return
      }
      consola.debug(`${this.logPrefix} No message for ${Globals.SOCKET_DEAD_AFTER} ms, replacing the connection`)
      this.giveUp(connection)
    }, Globals.SOCKET_DEAD_AFTER)
  }

  private quietIsExpected () {
    return !this.store || this.store.state.socket.disconnecting || this.store.state.files.download
  }

  /**
   * Treats a connection that stopped answering as closed now. A browser
   * WebSocket on a dead path can take minutes to report its close, so the
   * old one is closed in the background and its own close event ignored.
   */
  private giveUp (connection: PrinterSocket) {
    this.onConnectionClose(connection, { code: 4000, reason: 'no messages', wasClean: false })
    connection.close()
  }

  close () {
    this.attempt++
    this.cancelRetry()
    clearTimeout(this.pingTimeout)
    clearTimeout(this.deadTimeout)
    if (this.connection) {
      this.closing = true
      this.cache = null
      this.connection.close()
      this.reconnectCount = 0
    }
  }

  async connect (url?: string) {
    if (url) this.url = url
    const attempt = ++this.attempt
    const target = this.url
    this.cache = null
    this.closing = false
    this.cancelRetry()

    try {
      const response = await httpClientActions.accessOneshotTokenGet({ timeout: TOKEN_TIMEOUT_MS })
      // Fluidd moved on while the token came: another printer, or closed.
      if (attempt !== this.attempt || target !== this.url) return

      const token = response.data.result

      // Good. Move on with setting up the socket.
      if (this.store) this.store.dispatch('socket/onSocketConnecting', true)
      this.bindConnection(new WebSocket(`${this.url}?token=${token}`))
    } catch (error: unknown) {
      if (attempt !== this.attempt) return
      // Bad. If this is a 401, then don't retry. Otherwise do.
      if (
        !axios.isAxiosError(error) ||
        error.response?.status !== 401
      ) {
        this.reconnect()
      }
    }
  }

  /**
   * Bind a socket returned by an authorized printer transport. Event handlers
   * are installed before an already-open socket enters the normal open path.
   */
  adoptTransportSocket (
    connection: PrinterSocket,
    reconnect?: () => Promise<PrinterSocket>
  ) {
    this.attempt++
    this.closing = false
    this.cancelRetry()
    this.bindConnection(connection, reconnect ?? null)
  }

  /** Ends an adopted session without allowing its close event to reconnect. */
  releaseTransportSocket (closeConnection = true) {
    this.attempt++
    this.cancelRetry()
    const connection = this.connection
    this.connection = null
    this.transportReconnect = null
    this.cache = null
    this.reconnectCount = 0
    if (connection) {
      this.openedConnections.delete(connection as object)
      if (closeConnection) connection.close()
    }
  }

  private bindConnection (
    connection: PrinterSocket,
    reconnect: (() => Promise<PrinterSocket>) | null = null
  ) {
    this.connection = connection
    this.transportReconnect = reconnect
    connection.addEventListener('open', () => this.onConnectionOpen(connection))
    connection.addEventListener('close', event => this.onConnectionClose(connection, event as SocketCloseEvent))
    connection.addEventListener('error', event => this.onConnectionError(connection, event))
    connection.addEventListener('message', event => this.onConnectionMessage(connection, event as SocketMessageEvent))

    if (connection.readyState === PRINTER_SOCKET_OPEN) {
      this.onConnectionOpen(connection)
    }
  }

  private onConnectionOpen (connection: PrinterSocket) {
    if (this.connection !== connection || this.openedConnections.has(connection as object)) return

    this.openedConnections.add(connection as object)
    this.reconnectCount = 0
    this.armSilenceTimers()
    if (this.store) {
      this.store.dispatch('socket/onSocketConnecting', false)
      this.store.dispatch('socket/onSocketOpen', true)
    }
  }

  /**
   * Any close Fluidd did not ask for is retried, clean or not: Moonraker
   * closes cleanly when it reaps a socket that stopped answering, and over
   * Iroh every close from the printer arrives as clean. The store hears a
   * close Fluidd asked for as clean and any other as not.
   */
  private onConnectionClose (connection: PrinterSocket, event: SocketCloseEvent) {
    if (this.connection !== connection) return

    consola.debug(`${this.logPrefix} Connection closed:`, event)
    clearTimeout(this.pingTimeout)
    clearTimeout(this.deadTimeout)
    const asked = this.closing
    this.closing = false
    if (this.store) {
      if (this.store.state.socket.stalled) this.store.commit('socket/setSocketStalled', false)
      this.store.dispatch('socket/onSocketClose', { code: event.code, reason: event.reason, wasClean: asked })
    }
    if (asked) return
    if (this.transportReconnect) {
      this.reconnectTransport(this.transportReconnect)
    } else {
      this.reconnect()
    }
  }

  private onConnectionError (connection: PrinterSocket, event: unknown) {
    if (this.connection !== connection) return

    consola.error(`${this.logPrefix} Connection error:`, event)
    if (this.store) this.store.dispatch('socket/onSocketError', event)
  }

  private onConnectionMessage (connection: PrinterSocket, message: SocketMessageEvent) {
    if (this.connection !== connection) return

    // Parse the data packet.
    const d: SocketResponse = JSON.parse(message.data)

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

    if (d.error) {
      if (request) {
        Object.defineProperty(d.error, '__request__', { enumerable: false, value: request })
      }
      consola.debug(`${this.logPrefix} Response error:`, d.error)
      if (this.store) this.store.dispatch('socket/onSocketError', d.error)
      return
    }

    this.pong()

    if (request) {
      let result = (d.result) ? d.result : d.params
      if (typeof result === 'string') result = { result }

      Object.defineProperty(result, '__request__', { enumerable: false, value: request })
      consola.debug(`${this.logPrefix} Response:`, result)
      if (request.dispatch && this.store) this.store.dispatch(request.dispatch, result)
      if (request.commit && this.store) this.store.commit(request.commit, result)
    } else if (d.params && d.params[0]) {
      const [params, eventtime] = d.params

      if (d.method !== 'notify_status_update') {
        if (this.store) this.store.dispatch('socket/' + camelCase(d.method), params)
      } else {
        for (const key of ['motion_report']) {
          if (this.store && key in params) {
            this.store.dispatch('printer/onFastNotifyStatusUpdate', { key, payload: params[key] }, { root: true })
            delete params[key]
          }
        }

        const timestamp = eventtime ? eventtime * 1000 : Date.now()
        this.cache = (!this.cache)
          ? { timestamp, params }
          : { timestamp: this.cache.timestamp, params: mergeWith(this.cache.params, params, (dest, src) => Array.isArray(dest) ? src : undefined) }

        if (timestamp - this.cache.timestamp >= 1000) {
          if (this.store) this.store.dispatch('socket/' + camelCase(d.method), this.cache.params)
          this.cache = { timestamp, params: {} }
        }
      }
    } else {
      if (this.store) this.store.dispatch('socket/' + camelCase(d.method))
    }
  }

  /** The wait before the next try: doubling from reconnectInterval, capped, with jitter. */
  nextDelay () {
    const base = Math.min(MAX_RECONNECT_DELAY_MS, this.reconnectInterval * 2 ** Math.min(this.reconnectCount, 16))
    return Math.round(base * (0.8 + Math.random() * 0.4))
  }

  private scheduleRetry (action: () => void) {
    this.cancelRetry()
    const delay = this.nextDelay()
    this.reconnectCount += 1
    consola.debug(`${this.logPrefix} Reconnecting in ${delay}`)
    this.retryAction = action
    this.retryAt = Date.now() + delay
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      this.retryAction = null
      this.retryAt = null
      action()
    }, delay)
  }

  private cancelRetry () {
    if (this.retryTimer !== null) clearTimeout(this.retryTimer)
    this.retryTimer = null
    this.retryAction = null
    this.retryAt = null
  }

  /** Runs a waiting retry now, from the first step of the backoff. */
  retryNow () {
    const action = this.retryAction
    if (!action) return
    this.cancelRetry()
    this.reconnectCount = 0
    action()
  }

  /** When the waiting try to reconnect runs (Date.now() ms), or null when none is waiting. */
  get nextRetryAt (): number | null {
    return this.retryAt
  }

  /** Whether a try to reconnect is waiting for its turn. */
  get retryPending () {
    return this.retryAction !== null
  }

  private reconnectTransport (reconnect: () => Promise<PrinterSocket>) {
    this.connection = null
    this.scheduleRetry(async () => {
      if (this.transportReconnect !== reconnect) return
      try {
        const connection = await reconnect()
        if (this.transportReconnect === reconnect) {
          this.bindConnection(connection, reconnect)
        } else {
          connection.close()
        }
      } catch (_error) {
        if (this.transportReconnect === reconnect) this.reconnectTransport(reconnect)
      }
    })
  }

  reconnect () {
    this.connection = null
    if (!this.reconnectEnabled) {
      if (this.store) this.store.dispatch('socket/onSocketConnecting', false)
      return
    }
    this.scheduleRetry(() => { this.connect() })
  }

  /**
   * Sends data TO the socket
   * @param method
   * @param params
   */
  emit (method: string, options?: NotifyOptions) {
    if (this.store.state.socket.disconnecting || this.store.state.socket.connecting) {
      consola.debug(`${this.logPrefix} Socket emit denied, in disconnecting state:`, method, options)

      return
    }

    if (this.connection?.readyState === PRINTER_SOCKET_OPEN) {
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
        id,
        method
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
      consola.debug(`${this.logPrefix} Not ready, or closed.`, method, options, this.connection?.readyState)
    }
  }
}

export const SocketPlugin = {
  install (Vue: typeof _Vue, options?: SocketPluginOptions) {
    if (options?.url == null || options.store == null) {
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
  url: string;
  token?: string;
  reconnectEnabled?: boolean;
  reconnectInterval?: number;
  store: Store<RootState>;
}

export interface NotifyOptions {
  params?: any;
  dispatch?: string;
  commit?: string;
  wait?: string;
}

interface Request {
  id: number;
  method?: string;
  dispatch?: string;
  commit?: string;
  params?: any;
  wait?: string;
}

interface SocketRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params?: any;
}

interface SocketResponse {
  jsonrpc: string; // always available
  method?: string; // generic responses
  params?: [any, number?]; // generic responses
  id?: number; // specific response
  result?: any; // specific response
  error?: string | SocketError; // specific response
}

interface SocketError {
  code: number;
  message: string;
}

interface CachedParams {
  timestamp: number;
  params: any;
}

interface SocketCloseEvent {
  code?: number;
  reason?: string;
  wasClean: boolean;
}

interface SocketMessageEvent {
  data: string;
}
