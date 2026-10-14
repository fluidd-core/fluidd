import type {
  AuthorizedManagedRelaySession,
  ManagedIrohEndpoint,
  ManagedIrohRelay,
  ManagedIrohTransportOptions,
  ManagedTransportConnection,
  ManagedTransportRequestUsage,
  ManagedTransportStatus,
  ManagedTransportUsage,
  PrinterSocket,
  PrinterTransport
} from './types'

/** The longest wait between two dials of the same printer. */
const MAX_DIAL_DELAY_MS = 30_000

/**
 * Dials that fail in a row before a new handoff is asked for. The grant lasts
 * hours, so a failed dial is usually the path, not the grant; but a printer
 * that restarted has forgotten it, and only a new handoff gets back in.
 */
const REAUTHORIZE_AFTER_FAILURES = 2

/**
 * Contract-only browser adapter for an authorized managed relay session.
 * Endpoint creation is delayed until selected-printer traffic begins. It owns
 * no discovery, account, grant, loopback, encryption, or device-side logic.
 *
 * A relay that fails a request is assumed gone: it is dropped, and the next
 * request dials the printer again, with backoff. Once dropped, a connection
 * is never reused, because a dead one fails every request at once and only a
 * reload used to recover.
 */
export class ManagedIrohPrinterTransport implements PrinterTransport {
  private readonly options: ManagedIrohTransportOptions
  private session: AuthorizedManagedRelaySession
  private endpoint: ManagedIrohEndpoint | null = null
  private relayPromise: Promise<ManagedIrohRelay> | null = null
  private selectionGeneration = 0
  private failedDials = 0
  private nextDialAt = 0
  private readonly sockets = new Set<PrinterSocket>()
  private currentStatus: ManagedTransportStatus = {
    contractVersion: 'managed-iroh/v1',
    connection: 'idle',
    usage: 'IdleStatus'
  }

  constructor (options: ManagedIrohTransportOptions) {
    this.options = options
    this.session = options.authorizedSession
  }

  get status (): ManagedTransportStatus {
    return { ...this.currentStatus }
  }

  fetch (path: string, init?: RequestInit): Promise<Response> {
    return this.fetchWithUsage(path, init, 'Http')
  }

  async fetchWithUsage (
    path: string,
    init: RequestInit | undefined,
    usage: ManagedTransportRequestUsage
  ): Promise<Response> {
    this.assertOpen()
    this.updateStatus('connecting', usage)
    const relay = this.relay()
    try {
      const response = await (await relay).fetch(path, init)
      this.assertOpen()
      this.updateStatus('connected', 'IdleStatus')
      return response
    } catch (error) {
      // Cancelling an upload or file read must not disconnect every other
      // caller of a shared relay, including the dashboard socket.
      if (init?.signal?.aborted) throw error
      this.dropRelay(relay)
      this.markUnavailableUnlessClosed()
      throw error
    }
  }

  async openWebSocket (path: string): Promise<PrinterSocket> {
    this.assertOpen()
    this.updateStatus('connecting', 'WebSocket')
    const relay = this.relay()
    try {
      const socket = await (await relay).openWebSocket(path)
      if (this.currentStatus.connection === 'closed') {
        socket.close()
        throw new Error('Managed Iroh printer selection closed before socket was ready')
      }
      this.sockets.add(socket)
      this.updateStatus('connected', 'WebSocket')
      socket.addEventListener('close', () => {
        this.sockets.delete(socket)
        if (this.currentStatus.connection !== 'closed') {
          this.updateStatus('connected', 'IdleStatus')
        }
      })
      return socket
    } catch (error) {
      this.dropRelay(relay)
      this.markUnavailableUnlessClosed()
      throw error
    }
  }

  close () {
    this.selectionGeneration += 1
    const endpoint = this.endpoint
    this.endpoint = null
    for (const socket of this.sockets) socket.close()
    this.sockets.clear()
    this.relayPromise?.then(relay => relay.close()).catch(() => {})
    endpoint?.close()
    this.relayPromise = null
    this.updateStatus('closed', 'IdleStatus')
  }

  private relay (): Promise<ManagedIrohRelay> {
    if (!this.relayPromise) {
      const dial = this.dial(this.selectionGeneration)
      this.relayPromise = dial
      // A failed dial is not kept: the next request dials again.
      dial.catch(() => {
        if (this.relayPromise === dial) this.relayPromise = null
      })
    }
    return this.relayPromise
  }

  private assertOpen () {
    if (this.currentStatus.connection === 'closed') throw new Error('Managed Iroh printer selection is closed')
  }

  private async dial (generation: number): Promise<ManagedIrohRelay> {
    const closed = () => new Error('Managed Iroh printer selection closed before endpoint was ready')
    const wait = this.nextDialAt - Date.now()
    if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait))
    if (generation !== this.selectionGeneration) throw closed()
    try {
      if (this.failedDials >= REAUTHORIZE_AFTER_FAILURES && this.options.reauthorize) {
        this.session = await this.options.reauthorize()
        if (generation !== this.selectionGeneration) throw closed()
      }
      let endpoint = this.endpoint
      if (!endpoint) {
        endpoint = await this.options.createEndpoint()
        if (generation !== this.selectionGeneration) {
          endpoint.close()
          throw closed()
        }
        this.endpoint = endpoint
      }
      const relay = await endpoint.openRelay(this.session)
      if (generation !== this.selectionGeneration) {
        relay.close()
        throw closed()
      }
      this.failedDials = 0
      this.nextDialAt = 0
      return relay
    } catch (error) {
      if (generation === this.selectionGeneration) {
        this.failedDials += 1
        this.nextDialAt = Date.now() + Math.min(MAX_DIAL_DELAY_MS, 1000 * 2 ** (this.failedDials - 1))
      }
      throw error
    }
  }

  /** A request failed on `relay`: close it, so the next request dials a new one. */
  private dropRelay (relay: Promise<ManagedIrohRelay>) {
    if (this.relayPromise !== relay) return
    this.relayPromise = null
    relay.then(r => r.close()).catch(() => {})
  }

  private markUnavailableUnlessClosed () {
    if (this.currentStatus.connection !== 'closed') {
      this.updateStatus('unavailable', 'IdleStatus')
    }
  }

  private updateStatus (
    connection: ManagedTransportConnection,
    usage: ManagedTransportUsage
  ) {
    this.currentStatus = {
      contractVersion: 'managed-iroh/v1',
      connection,
      usage
    }
    this.options.onStatusChange?.(this.status)
  }
}
