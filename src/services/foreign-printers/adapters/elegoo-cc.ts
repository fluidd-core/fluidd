import type { AdapterDeps, ForeignCapabilities, ForeignFile, ForeignPrinterRecord } from '../types'
import { clampProgress, SocketAdapter, temp } from './base'

const capabilities: ForeignCapabilities = {
  pauseResume: true,
  stop: true,
  camera: true,
  listFiles: true,
  printFromStorage: true,
  upload: false
}

export default class ElegooCentauriAdapter extends SocketAdapter {
  readonly kind = 'elegoo-cc' as const
  readonly capabilities = capabilities
  private files: ForeignFile[] = []

  constructor (private readonly record: ForeignPrinterRecord, deps: AdapterDeps) {
    super(deps)
  }

  async connect (): Promise<void> {
    const host = this.record.host.replace(/:\d+$/, '')
    return this.openSocket(`ws://${host}:3030/websocket`)
  }

  protected onMessage (data: string) {
    let message: any
    try {
      message = JSON.parse(data)
    } catch {
      return
    }
    const mainboard = message.MainboardID
    if (typeof mainboard === 'string' && mainboard) this.record.serial = mainboard
    const status = message.Status
    if (status) {
      const info = status.PrintInfo ?? {}
      const code = Number(info.Status)
      const temps = [
        temp('nozzle', status.TempOfNozzle, status.TempTargetNozzle),
        temp('bed', status.TempOfHotbed, status.TempTargetHotbed),
        temp('chamber', status.TempOfBox, null)
      ].filter((item): item is NonNullable<typeof item> => item !== null)
      const elapsed = typeof info.CurrentTicks === 'number' ? info.CurrentTicks : null
      const total = typeof info.TotalTicks === 'number' ? info.TotalTicks : null
      this.setStatus({
        state: [13, 8, 9, 20].includes(code) ? 'printing' : [5, 10].includes(code) ? 'paused' : code === 0 ? 'idle' : this.status.state,
        message: typeof status.CurrentStatus?.[0] === 'string' ? status.CurrentStatus[0] : null,
        file: typeof info.Filename === 'string' ? info.Filename : null,
        progress: clampProgress(info.Progress, true) ?? (elapsed !== null && total ? clampProgress(elapsed / total) : null),
        timeLeft: elapsed !== null && total !== null ? Math.max(0, total - elapsed) : null,
        temps
      })
    }
    const response = message.Data?.Data ?? message.Data ?? {}
    if (Number(message.Data?.Cmd ?? response.Cmd) === 258) {
      const files = response.Files ?? response.FileList ?? response.files ?? []
      if (Array.isArray(files)) {
        this.files = files.map((file: any) => {
          const path = String(file.Path ?? file.path ?? file.Filename ?? file.name ?? '')
          return { path, name: String(file.Name ?? file.name ?? path.split('/').pop() ?? '') }
        })
      }
    }
    const videoUrl = response.VideoUrl ?? message.VideoUrl
    if (typeof videoUrl === 'string') {
      try {
        const url = new URL(videoUrl, `http://${this.record.host}`)
        this.setStatus({ cameraUrl: url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null })
      } catch {}
    }
  }

  private sendCommand (cmd: number, data: Record<string, unknown> = {}) {
    const id = crypto.randomUUID().replace(/-/g, '')
    this.send(JSON.stringify({
      Id: '',
      Data: {
        Cmd: cmd,
        Data: data,
        RequestID: id,
        MainboardID: this.record.serial ?? '',
        TimeStamp: Math.floor((this.deps.now?.() ?? Date.now()) / 1000),
        From: 1
      },
      Topic: `sdcp/request/${this.record.serial ?? ''}`
    }))
  }

  pause (): Promise<void> { this.sendCommand(129); return Promise.resolve() }
  resume (): Promise<void> { this.sendCommand(131); return Promise.resolve() }
  stop (): Promise<void> { this.sendCommand(130); return Promise.resolve() }

  async listFiles (): Promise<ForeignFile[]> {
    this.sendCommand(258, { Url: '/local' })
    return this.files
  }

  printFile (path: string): Promise<void> {
    this.sendCommand(128, { Filename: path.startsWith('/local/') ? path : `/local/${path}`, StartLayer: 0 })
    return Promise.resolve()
  }

  private sendCamera () {
    this.sendCommand(386, { Enable: 1 })
  }

  protected override onOpen (socket: WebSocket) {
    super.onOpen(socket)
    this.sendCommand(1)
    this.sendCommand(0)
    this.sendCamera()
  }
}
