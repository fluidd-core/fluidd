export type DirectKind = 'moonraker' | 'octoprint' | 'creality' | 'elegoo-cc'
export type BridgeKind = 'bambu' | 'prusalink' | 'anycubic'
export type ForeignKind = DirectKind | BridgeKind
export type FormFactor = 'enclosed' | 'open-frame' | 'bed-slinger'

export interface ForeignPrinterRecord {
  id: string
  kind: ForeignKind
  name: string
  model?: string
  host: string
  serial?: string
  via: 'direct' | 'm1'
  m1Name?: string
  formFactor: FormFactor
  credentialsRef: string | null
  addedAt: number
}

export type ForeignState = 'connecting' | 'idle' | 'printing' | 'paused' | 'error' | 'offline'

export const FOREIGN_STATE_LABELS: Record<ForeignState, string> = {
  printing: 'Printing',
  paused: 'Paused',
  idle: 'Ready',
  connecting: 'Connecting',
  offline: 'Offline',
  error: 'Error'
}

export const FOREIGN_STATE_TONES: Record<ForeignState, 'run' | 'warn' | 'ok' | 'off' | 'err'> = {
  printing: 'run',
  paused: 'warn',
  idle: 'ok',
  connecting: 'warn',
  offline: 'off',
  error: 'err'
}

export interface ForeignTemp {
  id: 'nozzle' | 'bed' | 'chamber'
  actual: number
  target: number | null
}

export interface ForeignStatus {
  state: ForeignState
  message: string | null
  file: string | null
  progress: number | null
  timeLeft: number | null
  temps: ForeignTemp[]
  cameraUrl: string | null
}

export interface ForeignCapabilities {
  pauseResume: boolean
  stop: boolean
  camera: boolean
  listFiles: boolean
  printFromStorage: boolean
  upload: boolean
}

export interface ForeignFile {
  path: string
  name: string
  size?: number
  modified?: number
}

export interface ForeignCredentials {
  apiKey?: string
}

export interface ForeignAdapter {
  readonly kind: DirectKind
  readonly capabilities: ForeignCapabilities
  readonly status: ForeignStatus
  onStatus (cb: (s: ForeignStatus) => void): () => void
  connect (): Promise<void>
  close (): void
  pause (): Promise<void>
  resume (): Promise<void>
  stop (): Promise<void>
  listFiles? (): Promise<ForeignFile[]>
  printFile? (path: string): Promise<void>
  upload? (file: File | Blob, name: string, print: boolean): Promise<void>
}

export interface AdapterDeps {
  fetch: (url: string, init?: RequestInit) => Promise<Response>
  WebSocket: typeof WebSocket
  now?: () => number
}
