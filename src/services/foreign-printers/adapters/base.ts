import { lanFetch } from '@/services/muon-cloud/discovery'
import type {
  AdapterDeps,
  ForeignAdapter,
  ForeignCapabilities,
  ForeignStatus,
  ForeignTemp
} from '../types'

export const defaultAdapterDeps = (): AdapterDeps => ({
  fetch: lanFetch,
  WebSocket
})

export const emptyStatus = (): ForeignStatus => ({
  state: 'connecting',
  message: null,
  file: null,
  progress: null,
  timeLeft: null,
  temps: [],
  cameraUrl: null
})

export const httpUrl = (host: string, path: string) => `http://${host}${path}`

export async function fetchJson (
  deps: AdapterDeps,
  url: string,
  init: RequestInit = {},
  apiKey?: string,
  timeout = 5000
): Promise<any> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  const headers = new Headers(init.headers)
  if (apiKey) headers.set('X-Api-Key', apiKey)
  try {
    const response = await deps.fetch(url, { ...init, headers, signal: controller.signal, cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    if (response.status === 204) return null
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

export function temp (id: ForeignTemp['id'], actual: unknown, target: unknown): ForeignTemp | null {
  if (typeof actual !== 'number') return null
  return {
    id,
    actual,
    target: typeof target === 'number' ? target : null
  }
}

export const clampProgress = (value: unknown, percent = false): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const ratio = percent ? value / 100 : value
  return Math.min(1, Math.max(0, ratio))
}

export abstract class SocketAdapter implements ForeignAdapter {
  abstract readonly kind: ForeignAdapter['kind']
  abstract readonly capabilities: ForeignCapabilities
  status = emptyStatus()
  protected socket: WebSocket | null = null
  protected closed = false
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private retryDelay = 2000
  private listeners = new Set<(status: ForeignStatus) => void>()

  protected readonly deps: AdapterDeps

  protected constructor (deps: AdapterDeps) {
    this.deps = deps
  }

  onStatus (cb: (status: ForeignStatus) => void): () => void {
    this.listeners.add(cb)
    cb(this.status)
    return () => this.listeners.delete(cb)
  }

  protected setStatus (patch: Partial<ForeignStatus>) {
    this.status = { ...this.status, ...patch }
    this.listeners.forEach(listener => listener(this.status))
  }

  protected openSocket (url: string, protocols?: string | string[]): Promise<void> {
    this.closed = false
    this.setStatus({ state: 'connecting', message: null })
    return new Promise((resolve, reject) => {
      let opened = false
      const socket = protocols
        ? new this.deps.WebSocket(url, protocols)
        : new this.deps.WebSocket(url)
      this.socket = socket
      socket.onopen = () => {
        opened = true
        this.retryDelay = 2000
        this.setStatus({ state: 'idle', message: null })
        this.onOpen(socket)
        resolve()
      }
      socket.onmessage = event => this.onMessage(String(event.data))
      socket.onerror = () => {
        if (!opened) reject(new Error('WebSocket connection failed'))
        this.disconnected(socket)
      }
      socket.onclose = () => {
        if (!opened) reject(new Error('WebSocket closed before connecting'))
        this.disconnected(socket)
      }
    })
  }

  protected onOpen (socket: WebSocket) {
    if (socket.readyState !== this.deps.WebSocket.OPEN) this.setStatus({ state: 'offline' })
  }

  protected onDisconnect () {}
  protected abstract onMessage (data: string): void

  protected send (data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (this.socket?.readyState !== this.deps.WebSocket.OPEN) throw new Error('Printer is offline')
    this.socket.send(data)
  }

  private disconnected (socket: WebSocket) {
    if (this.socket !== socket || this.closed) return
    this.setStatus({ state: 'offline' })
    this.onDisconnect()
    if (this.retryTimer) return
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      if (this.closed) return
      this.retryDelay = Math.min(this.retryDelay * 2, 30000)
      this.connect().catch(() => {})
    }, this.retryDelay)
  }

  abstract connect (): Promise<void>
  abstract pause (): Promise<void>
  abstract resume (): Promise<void>
  abstract stop (): Promise<void>

  close () {
    this.closed = true
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.retryTimer = null
    const socket = this.socket
    this.socket = null
    if (socket && socket.readyState < this.deps.WebSocket.CLOSING) socket.close()
  }
}
