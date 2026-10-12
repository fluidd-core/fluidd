import type { AdapterDeps, ForeignCapabilities, ForeignPrinterRecord } from '../types'
import { clampProgress, SocketAdapter, temp } from './base'

const capabilities: ForeignCapabilities = {
  pauseResume: true,
  stop: true,
  camera: true,
  listFiles: false,
  printFromStorage: false,
  upload: false
}

export default class CrealityAdapter extends SocketAdapter {
  readonly kind = 'creality' as const
  readonly capabilities = capabilities
  private telemetry: Record<string, any> = {}

  constructor (private readonly record: ForeignPrinterRecord, deps: AdapterDeps) {
    super(deps)
  }

  async connect (): Promise<void> {
    const host = this.record.host.replace(/:\d+$/, '')
    return this.openSocket(`ws://${host}:9999`, 'wsslicer')
  }

  protected onOpen (socket: WebSocket) {
    socket.send(JSON.stringify({ method: 'get', params: { ReqPrinterPara: 1 } }))
    this.setStatus({ cameraUrl: `http://${this.record.host.replace(/:\d+$/, '')}:8080/?action=stream` })
  }

  protected onMessage (data: string) {
    if (data === 'ok') return
    let message: any
    try {
      message = JSON.parse(data)
    } catch {
      return
    }
    if (message.ModeCode === 'heart_beat') {
      this.socket?.send('ok')
      return
    }
    this.telemetry = { ...this.telemetry, ...message }
    const error = Number(this.telemetry.err?.errcode ?? 0) !== 0
    const state = Number(this.telemetry.state)
    this.setStatus({
      state: error ? 'error' : state === 5 ? 'paused' : state === 1 ? 'printing' : 'idle',
      message: error ? String(this.telemetry.err?.errinfo ?? 'Printer error') : null,
      file: this.telemetry.printFileName ?? null,
      progress: clampProgress(this.telemetry.printProgress, true),
      timeLeft: typeof this.telemetry.printLeftTime === 'number' ? this.telemetry.printLeftTime : null,
      temps: [
        temp('nozzle', this.telemetry.nozzleTemp, this.telemetry.targetNozzleTemp),
        temp('bed', this.telemetry.bedTemp0, this.telemetry.targetBedTemp0)
      ].filter((item): item is NonNullable<typeof item> => item !== null)
    })
  }

  private command (field: 'pause' | 'stop', value: number): Promise<void> {
    this.send(JSON.stringify({ method: 'set', params: { [field]: value } }))
    return Promise.resolve()
  }

  pause (): Promise<void> { return this.command('pause', 1) }
  resume (): Promise<void> { return this.command('pause', 0) }
  stop (): Promise<void> { return this.command('stop', 1) }
}
