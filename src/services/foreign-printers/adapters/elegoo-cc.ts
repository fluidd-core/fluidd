import type { AdapterDeps, ForeignCapabilities, ForeignFile, ForeignPrinterRecord } from '../types'
import { clampProgress, SocketAdapter, temp } from './base'

export const ELEGOO_CC_CAPABILITIES: ForeignCapabilities = {
  pauseResume: true,
  stop: true,
  camera: true,
  listFiles: true,
  printFromStorage: true,
  upload: false
}

interface PendingCommand {
  cmd: number
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

export default class ElegooCentauriAdapter extends SocketAdapter {
  readonly kind = 'elegoo-cc' as const
  readonly capabilities = ELEGOO_CC_CAPABILITIES
  private files: ForeignFile[] = []
  private pending = new Map<string, PendingCommand>()

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
      const label = status.CurrentStatus?.[0]
      const temps = [
        temp('nozzle', status.TempOfNozzle, status.TempTargetNozzle),
        temp('bed', status.TempOfHotbed, status.TempTargetHotbed),
        temp('chamber', status.TempOfBox, null)
      ].filter((item): item is NonNullable<typeof item> => item !== null)
      const elapsed = typeof info.CurrentTicks === 'number' ? info.CurrentTicks : null
      const total = typeof info.TotalTicks === 'number' ? info.TotalTicks : null
      this.setStatus({
        state: typeof label === 'string' && /error|failed/i.test(label)
          ? 'error'
          : [13, 8, 9, 20].includes(code) ? 'printing' : [5, 10].includes(code) ? 'paused' : code === 0 ? 'idle' : this.status.state,
        message: typeof label === 'string' ? label : null,
        file: typeof info.Filename === 'string' ? info.Filename : null,
        progress: clampProgress(info.Progress, true) ?? (elapsed !== null && total ? clampProgress(elapsed / total) : null),
        timeLeft: elapsed !== null && total !== null ? Math.max(0, total - elapsed) : null,
        temps
      })
    }
    if (typeof message.Topic === 'string' && message.Topic.startsWith('sdcp/response/')) this.onResponse(message)
    const response = message.Data?.Data ?? message.Data ?? {}
    const videoUrl = response.VideoUrl ?? message.VideoUrl
    if (typeof videoUrl === 'string') {
      try {
        const url = new URL(videoUrl, `http://${this.record.host}`)
        this.setStatus({ cameraUrl: url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null })
      } catch {}
    }
  }

  private envelope (cmd: number, data: Record<string, unknown> = {}) {
    const id = crypto.randomUUID().replace(/-/g, '')
    return {
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
    }
  }

  private sendUntrackedCommand (cmd: number, data: Record<string, unknown> = {}) {
    this.send(JSON.stringify(this.envelope(cmd, data)))
  }

  private sendCommand<T = void> (cmd: number, data: Record<string, unknown> = {}): Promise<T> {
    const envelope = this.envelope(cmd, data)
    const requestId = envelope.Data.RequestID
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (!this.pending.delete(requestId)) return
        reject(new Error(`The printer did not answer command ${cmd} within 5 seconds`))
      }, 5000)
      this.pending.set(requestId, {
        cmd,
        resolve: value => resolve(value as T),
        reject,
        timer
      })
      try {
        this.send(JSON.stringify(envelope))
      } catch (error) {
        this.pending.delete(requestId)
        clearTimeout(timer)
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
  }

  private onResponse (message: any) {
    const envelope = message.Data ?? {}
    const response = envelope.Data ?? {}
    const cmd = Number(envelope.Cmd ?? response.Cmd)
    const requestId = typeof envelope.RequestID === 'string' ? envelope.RequestID : null
    const matched = requestId ? this.pending.get(requestId) : undefined
    const fallback = matched ? undefined : [...this.pending.entries()].find(([, pending]) => pending.cmd === cmd)
    const id = matched ? requestId! : fallback?.[0]
    const pending = matched ?? fallback?.[1]
    if (!pending || !id) return
    this.pending.delete(id)
    clearTimeout(pending.timer)

    const ack = Number(response.Ack ?? envelope.Ack)
    if (cmd === 258) {
      const files = response.Files ?? response.FileList ?? response.files ?? []
      if (Array.isArray(files)) {
        this.files = files.map((file: any) => {
          const path = String(file.Path ?? file.path ?? file.Filename ?? file.name ?? '')
          return { path, name: String(file.Name ?? file.name ?? path.split('/').pop() ?? '') }
        })
      }
    }
    if (ack === 0) {
      pending.resolve(cmd === 258 ? this.files : undefined)
    } else {
      pending.reject(new Error(ack === 1 ? 'The printer refused' : ack === 2 ? 'File not found' : `The printer returned acknowledgement ${ack}`))
    }
  }

  private rejectPending (error: Error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer)
      pending.reject(error)
    }
    this.pending.clear()
  }

  protected override onDisconnect () {
    this.rejectPending(new Error('Printer is offline'))
  }

  override close () {
    this.rejectPending(new Error('Printer is offline'))
    super.close()
  }

  pause (): Promise<void> { return this.sendCommand(129) }
  resume (): Promise<void> { return this.sendCommand(131) }
  stop (): Promise<void> { return this.sendCommand(130) }
  printFile (path: string): Promise<void> {
    return this.sendCommand(128, { Filename: path.startsWith('/local/') ? path : `/local/${path}`, StartLayer: 0 })
  }

  async listFiles (): Promise<ForeignFile[]> { return this.sendCommand<ForeignFile[]>(258, { Url: '/local' }) }

  private sendCamera () {
    this.sendUntrackedCommand(386, { Enable: 1 })
  }

  protected override onOpen (socket: WebSocket) {
    super.onOpen(socket)
    this.sendUntrackedCommand(1)
    this.sendUntrackedCommand(0)
    this.sendCamera()
  }
}
