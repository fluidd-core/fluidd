import type { AdapterDeps, ForeignCapabilities, ForeignCredentials, ForeignFile, ForeignPrinterRecord } from '../types'
import { clampProgress, fetchJson, httpUrl, SocketAdapter, temp } from './base'
import { localCameraUrl } from '../address'

export const MOONRAKER_CAPABILITIES: ForeignCapabilities = {
  pauseResume: true,
  stop: true,
  camera: true,
  listFiles: true,
  printFromStorage: true,
  upload: true
}

const OBJECTS = {
  print_stats: null,
  virtual_sdcard: null,
  extruder: null,
  heater_bed: null,
  pause_resume: null
}

export default class MoonrakerAdapter extends SocketAdapter {
  readonly kind = 'moonraker' as const
  readonly capabilities = MOONRAKER_CAPABILITIES
  private requestId = 1
  private telemetry: Record<string, any> = {}

  constructor (
    private readonly record: ForeignPrinterRecord,
    private readonly credentials: ForeignCredentials | null,
    deps: AdapterDeps
  ) {
    super(deps)
  }

  async connect (): Promise<void> {
    const host = this.record.host
    const wsHost = host.includes(':') ? host : `${host}:80`
    await this.openSocket(`ws://${wsHost}/websocket`)
    this.readCamera().catch(() => {})
  }

  protected onOpen (socket: WebSocket) {
    this.telemetry = {}
    socket.send(JSON.stringify({
      jsonrpc: '2.0',
      method: 'server.connection.identify',
      params: { client_name: 'Muon3D Fluidd', version: '1', type: 'web', url: 'https://github.com/Muon-3D/Muon3D_Fluidd', ...(this.credentials?.apiKey ? { api_key: this.credentials.apiKey } : {}) },
      id: this.requestId++
    }))
    socket.send(JSON.stringify({
      jsonrpc: '2.0',
      method: 'printer.objects.subscribe',
      params: { objects: OBJECTS },
      id: this.requestId++
    }))
  }

  protected onMessage (data: string) {
    let message: any
    try {
      message = JSON.parse(data)
    } catch {
      return
    }
    if (message.error) {
      this.setStatus({ state: 'error', message: String(message.error.message ?? 'Moonraker rejected the request') })
      return
    }
    if (['notify_klippy_shutdown', 'notify_klippy_disconnected'].includes(message.method)) {
      this.setStatus({ state: 'error', message: 'Klipper is unavailable. Check the printer’s own screen.' })
      return
    }
    const payload = message.method === 'notify_status_update' ? message.params?.[0] : message.result?.status
    if (!payload || typeof payload !== 'object') return
    for (const name of Object.keys(OBJECTS)) {
      if (payload[name] && typeof payload[name] === 'object') this.telemetry[name] = { ...this.telemetry[name], ...payload[name] }
    }
    const print = this.telemetry.print_stats ?? {}
    const sd = this.telemetry.virtual_sdcard ?? {}
    const state = String(print.state ?? '').toLowerCase()
    const progress = clampProgress(sd.progress)
    const duration = typeof print.print_duration === 'number' ? print.print_duration : null
    const timeLeft = duration !== null && progress !== null && progress > 0
      ? Math.max(0, duration / progress - duration)
      : null
    const temps = [
      temp('nozzle', this.telemetry.extruder?.temperature, this.telemetry.extruder?.target),
      temp('bed', this.telemetry.heater_bed?.temperature, this.telemetry.heater_bed?.target)
    ].filter((item): item is NonNullable<typeof item> => item !== null)
    this.setStatus({
      state: state === 'printing' ? 'printing' : state === 'paused' ? 'paused' : state === 'error' ? 'error' : 'idle',
      message: print.message ?? null,
      file: typeof print.filename === 'string' && print.filename ? print.filename : null,
      progress,
      timeLeft,
      temps
    })
  }

  private async readCamera () {
    try {
      const response = await fetchJson(this.deps, httpUrl(this.record.host, '/server/webcams/list'), {}, this.credentials?.apiKey)
      const webcams = response?.result?.webcams ?? response?.webcams ?? []
      const camera = webcams.find((item: any) => item.enabled !== false && typeof item.stream_url === 'string')
      if (!camera) return
      this.setStatus({ cameraUrl: localCameraUrl(camera.stream_url, this.record.host) })
    } catch {}
  }

  private async command (method: string) {
    await fetchJson(this.deps, httpUrl(this.record.host, method), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    }, this.credentials?.apiKey)
  }

  pause (): Promise<void> { return this.command('/printer/print/pause') }
  resume (): Promise<void> { return this.command('/printer/print/resume') }
  stop (): Promise<void> { return this.command('/printer/print/cancel') }

  async listFiles (): Promise<ForeignFile[]> {
    const response = await fetchJson(this.deps, httpUrl(this.record.host, '/server/files/list?root=gcodes'), {}, this.credentials?.apiKey)
    const files = response?.result ?? response
    return (Array.isArray(files) ? files : []).map((file: any) => ({
      path: String(file.path ?? file.filename ?? ''),
      name: String(file.path ?? file.filename ?? '').split('/').pop() ?? '',
      size: typeof file.size === 'number' ? file.size : undefined,
      modified: typeof file.modified === 'number' ? file.modified : undefined
    }))
  }

  printFile (path: string): Promise<void> {
    return this.commandWithBody('/printer/print/start', { filename: path })
  }

  private async commandWithBody (path: string, body: unknown) {
    await fetchJson(this.deps, httpUrl(this.record.host, path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }, this.credentials?.apiKey)
  }

  async upload (file: File | Blob, name: string, print: boolean): Promise<void> {
    const form = new FormData()
    form.append('file', file, name)
    form.append('root', 'gcodes')
    if (print) form.append('print', 'true')
    const headers = this.credentials?.apiKey ? { 'X-Api-Key': this.credentials.apiKey } : undefined
    const response = await this.deps.fetch(httpUrl(this.record.host, '/server/files/upload'), {
      method: 'POST',
      body: form,
      headers,
      cache: 'no-store'
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    await response.json()
  }
}
