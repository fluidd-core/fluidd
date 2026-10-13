/**
 * The browser's Iroh endpoint, and the transport Fluidd's managed seam uses.
 *
 * One endpoint per tab, one key per browser: the key is kept in localStorage
 * so the grants the console issues for it survive a reload. Every printer is
 * reached through the relay the console names; a browser has no other path.
 */
import type {
  AuthorizedManagedRelaySession,
  ManagedIrohEndpoint,
  ManagedIrohRelay,
  PrinterSocket
} from '@/services/managed-transport'
import { bluetoothRouteFor, type WasmBleLink } from '@/services/muon-ble/link'
import { cloudBaseUrl } from './api'
import bundledWasmUrl from './vendor/muon-link-web/d71dbe1/muon_link_web_bg.wasm?url'

const KEY_STORAGE = 'muon.cloud.key'
// Remove after one release. Normal loads never depend on the console's files.
const ALLOW_CONSOLE_CLIENT_FALLBACK = true

interface WasmSocket {
  send (text: string): Promise<void>;
  next (): Promise<string | Uint8Array | null>;
  close (): Promise<void>;
}

interface WasmPrinter {
  printerId (): string;
  /** SEC-7's comparison value of this connection, "F6Q TDH" (muon-link#33 on). */
  comparison? (): string;
  fetch (method: string, path: string, headers: string[], body: Uint8Array): Promise<{ status: number, headers: string[], body: Uint8Array }>;
  openWebSocket (path: string): Promise<WasmSocket>;
  close (): void;
}

interface WasmEndpoint {
  endpointId (): string;
  secretKey (): Uint8Array;
  connect (printerId: string): Promise<WasmPrinter>;
  /** Takes a Web Bluetooth link to a printer (muon-link#31 on; ADR 0032 D3). */
  addLink? (role: 'central', maxSegment?: number): WasmBleLink;
  close (): Promise<void>;
}

interface WasmModule {
  default: (input?: unknown) => Promise<unknown>;
  MuonEndpoint: { create (relayUrl: string, secret: Uint8Array | null | undefined): Promise<WasmEndpoint> };
}

let modulePromise: Promise<WasmModule> | null = null
let endpointPromise: Promise<WasmEndpoint> | null = null
let endpointRelay = ''

function loadWasm (): Promise<WasmModule> {
  if (!modulePromise) {
    modulePromise = (async () => {
      try {
        const mod = await import('./vendor/muon-link-web/d71dbe1/muon_link_web.js') as WasmModule
        await mod.default({ module_or_path: bundledWasmUrl })
        return mod
      } catch (error) {
        if (!ALLOW_CONSOLE_CLIENT_FALLBACK) throw error
        const mod = await import(/* @vite-ignore */ `${cloudBaseUrl()}/muon-link-web/muon_link_web.js`) as WasmModule
        await mod.default()
        return mod
      }
    })()
    modulePromise.catch(() => { modulePromise = null })
  }
  return modulePromise
}

function hexToBytes (hex: string): Uint8Array | null {
  if (!/^[0-9a-f]{64}$/i.test(hex)) return null
  const out = new Uint8Array(32)
  for (let i = 0; i < 32; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

function bytesToHex (bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

/** The tab's endpoint, bound to `relayUrl`. */
export function browserEndpoint (relayUrl: string): Promise<WasmEndpoint> {
  if (!endpointPromise || endpointRelay !== relayUrl) {
    endpointRelay = relayUrl
    endpointPromise = (async () => {
      const mod = await loadWasm()
      let secret: Uint8Array | null = null
      try {
        secret = hexToBytes(localStorage.getItem(KEY_STORAGE) ?? '')
      } catch { /* no storage */ }
      const endpoint = await mod.MuonEndpoint.create(relayUrl, secret)
      try {
        localStorage.setItem(KEY_STORAGE, bytesToHex(endpoint.secretKey()))
      } catch { /* no storage */ }
      return endpoint
    })()
    endpointPromise.catch(() => { endpointPromise = null })
  }
  return endpointPromise
}

/** Forgets this browser's key, so the next sign-in starts from a new one. */
export function forgetBrowserKey () {
  try {
    localStorage.removeItem(KEY_STORAGE)
  } catch { /* no storage */ }
  endpointPromise?.then(e => e.close()).catch(() => {})
  endpointPromise = null
}

/** A WebSocket-shaped object over a gateway WebSocket, for Fluidd's socket client. */
class IrohSocket implements PrinterSocket {
  readyState = 1
  private readonly listeners = new Map<string, Array<(event: any) => void>>()

  private readonly inner: WasmSocket

  constructor (inner: WasmSocket) {
    this.inner = inner
    this.pump()
  }

  send (data: string) {
    if (this.readyState !== 1) return
    this.inner.send(data).catch(error => this.fail(error))
  }

  close () {
    if (this.readyState >= 2) return
    this.readyState = 2
    this.inner.close().catch(() => {}).finally(() => this.closed(1000, ''))
  }

  addEventListener (type: string, listener: (event: any) => void) {
    const list = this.listeners.get(type) ?? []
    list.push(listener)
    this.listeners.set(type, list)
  }

  private emit (type: string, event: any) {
    for (const listener of this.listeners.get(type) ?? []) listener(event)
  }

  private async pump () {
    // Let the caller attach listeners before the first message.
    await Promise.resolve()
    for (;;) {
      let message: string | Uint8Array | null
      try {
        message = await this.inner.next()
      } catch (error) {
        this.fail(error)
        return
      }
      if (message === null) {
        this.closed(1000, '')
        return
      }
      const data = typeof message === 'string' ? message : new TextDecoder().decode(message)
      this.emit('message', { data })
    }
  }

  private fail (error: unknown) {
    if (this.readyState === 3) return
    this.emit('error', { error })
    this.closed(1006, String((error as Error)?.message ?? error))
  }

  private closed (code: number, reason: string) {
    if (this.readyState === 3) return
    this.readyState = 3
    this.emit('close', { code, reason, wasClean: code === 1000 })
  }
}

/**
 * Headers that frame a request on the wire, which only the binding sets:
 * the length of the body it sends, and the hop-by-hop headers a client may
 * not choose (Fetch's forbidden request headers).
 */
const FRAMING_HEADERS = new Set([
  'content-length',
  'transfer-encoding',
  'connection',
  'keep-alive',
  'te',
  'trailer',
  'upgrade'
])

/** One printer's gateway connection, shaped as Fluidd's `ManagedIrohRelay`. */
/** The error fetch rejects with when its signal aborts. */
function abortError (signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('The request was aborted', 'AbortError')
}

/**
 * `sending`, or a rejection as soon as `signal` aborts. The binding has no
 * way to stop one request on a connection, so an aborted request's answer is
 * abandoned: the caller is free at once, and nothing reads what comes back.
 */
function untilAborted<T> (sending: Promise<T>, signal: AbortSignal | null | undefined): Promise<T> {
  if (!signal) return sending
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortError(signal))
    if (signal.aborted) return onAbort()
    signal.addEventListener('abort', onAbort, { once: true })
    sending.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort))
  })
}

export class IrohPrinter implements ManagedIrohRelay {
  private readonly printer: WasmPrinter

  constructor (printer: WasmPrinter) {
    this.printer = printer
  }

  async fetch (path: string, init?: RequestInit): Promise<Response> {
    const signal = init?.signal
    if (signal?.aborted) throw abortError(signal)
    const method = (init?.method ?? 'GET').toUpperCase()
    const headers: string[] = []
    const source = new Headers(init?.headers ?? {})
    source.forEach((value, name) => {
      // The gateway sets its own host and credentials, and the binding
      // frames the body it is given: a caller's own framing headers would
      // describe another body, or make the request ambiguous, which the
      // gateway refuses.
      if (name === 'host' || name === 'authorization' || FRAMING_HEADERS.has(name)) return
      headers.push(name, value)
    })
    let body = new Uint8Array()
    if (init?.body !== undefined && init.body !== null) {
      // Encoded once: every encoding of a FormData picks a new boundary, so
      // the bytes and the type must come from the same Response.
      const encoded = new Response(init.body as BodyInit)
      body = new Uint8Array(await encoded.arrayBuffer())
      if (init.body instanceof FormData) {
        // A multipart body's boundary lives in the type Response computed.
        const type = encoded.headers.get('content-type')
        if (type) {
          const i = headers.findIndex((h, n) => n % 2 === 0 && h.toLowerCase() === 'content-type')
          if (i >= 0) headers.splice(i, 2)
          headers.push('content-type', type)
        }
      } else if (typeof init.body === 'string' && !source.has('content-type')) {
        headers.push('content-type', 'application/json')
      }
    }
    // Aborted while the body was read: nothing is sent.
    if (signal?.aborted) throw abortError(signal)
    const answer = await untilAborted(this.printer.fetch(method, path, headers, body), signal)
    const responseHeaders = new Headers()
    for (let i = 0; i + 1 < answer.headers.length; i += 2) {
      try {
        responseHeaders.append(answer.headers[i], answer.headers[i + 1])
      } catch { /* a header the browser refuses to hold */ }
    }
    const nullBody = answer.status === 204 || answer.status === 304
    return new Response(nullBody ? null : answer.body, { status: answer.status, headers: responseHeaders })
  }

  async openWebSocket (path: string): Promise<PrinterSocket> {
    return new IrohSocket(await this.printer.openWebSocket(path))
  }

  close () {
    this.printer.close()
  }
}

/**
 * Dials `printerId`. When the person asked to open it over Bluetooth
 * (`useBluetoothFor`), the link comes up first, and Iroh then has the radio
 * as a path as well as the relay: for a printer with no Wi-Fi, the only one.
 */
export async function dialPrinter (endpoint: WasmEndpoint, printerId: string): Promise<WasmPrinter> {
  let bluetoothError: Error | null = null
  try {
    await bluetoothRouteFor(endpoint, printerId)
  } catch (error) {
    bluetoothError = error as Error
  }
  try {
    return await endpoint.connect(printerId)
  } catch (error) {
    if (bluetoothError) throw new Error(`Couldn't reach the printer over Bluetooth: ${bluetoothError.message}`)
    throw error
  }
}

/** Fluidd's `ManagedIrohEndpoint`: dials the printer the handoff names. */
export function managedEndpointFactory (): Promise<ManagedIrohEndpoint> {
  return Promise.resolve({
    async openRelay (session: AuthorizedManagedRelaySession) {
      const endpoint = await browserEndpoint(session.relayUrl)
      return new IrohPrinter(await dialPrinter(endpoint, session.printerId))
    },
    close () {}
  })
}
