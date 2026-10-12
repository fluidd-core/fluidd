import type { AdapterDeps, ForeignCapabilities, ForeignCredentials, ForeignFile, ForeignPrinterRecord } from '../types'
import { clampProgress, fetchJson, httpUrl, SocketAdapter, temp } from './base'

export const OCTOPRINT_CAPABILITIES: ForeignCapabilities = {
  pauseResume: true,
  stop: true,
  camera: true,
  listFiles: true,
  printFromStorage: true,
  upload: true
}

export default class OctoPrintAdapter extends SocketAdapter {
  readonly kind = 'octoprint' as const
  readonly capabilities = OCTOPRINT_CAPABILITIES
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private sessionAuth = ''

  constructor (
    private readonly record: ForeignPrinterRecord,
    private readonly credentials: ForeignCredentials | null,
    deps: AdapterDeps
  ) {
    super(deps)
  }

  async connect (): Promise<void> {
    const key = this.credentials?.apiKey
    try {
      const login = await fetchJson(this.deps, httpUrl(this.record.host, '/api/login?passive=true'), {}, key)
      this.sessionAuth = `${login.name}:${login.session}`
      await this.openSocket(`ws://${this.record.host}/sockjs/websocket`)
      this.readCamera().catch(() => {})
    } catch {
      this.startPolling()
      await this.poll()
    }
  }

  protected onMessage (data: string) {
    let message: any
    try {
      message = JSON.parse(data)
    } catch {
      return
    }
    const current = message.current ?? message.history
    if (!current) return
    const state = current.state ?? {}
    const flags = state.flags ?? {}
    const printing = !!flags.printing
    const paused = !!flags.paused
    const error = !!flags.error
    const job = current.job ?? {}
    const progress = clampProgress(current.progress?.completion, true)
    const temps = current.temps?.[0] ?? current.temps ?? {}
    this.setStatus({
      state: paused ? 'paused' : error ? 'error' : printing ? 'printing' : state.text === 'Offline' ? 'offline' : 'idle',
      message: typeof state.text === 'string' ? state.text : null,
      file: job.file?.path ?? job.file?.name ?? null,
      progress,
      timeLeft: typeof current.progress?.printTimeLeft === 'number' ? current.progress.printTimeLeft : null,
      temps: [
        temp('nozzle', temps.tool0?.actual, temps.tool0?.target),
        temp('bed', temps.bed?.actual, temps.bed?.target)
      ].filter((item): item is NonNullable<typeof item> => item !== null)
    })
  }

  protected onOpen (socket: WebSocket) {
    socket.send(JSON.stringify({ auth: this.sessionAuth }))
    socket.send(JSON.stringify({ throttle: 2 }))
    if (this.pollTimer) clearInterval(this.pollTimer)
    this.pollTimer = null
  }

  protected onDisconnect () {
    if (this.pollTimer) clearInterval(this.pollTimer)
    this.pollTimer = null
  }

  private async readCamera () {
    try {
      const settings = await fetchJson(this.deps, httpUrl(this.record.host, '/api/settings'), {}, this.credentials?.apiKey)
      const stream = settings?.webcam?.streamUrl ?? settings?.webcam?.snapshotUrl
      if (typeof stream !== 'string') return
      const url = new URL(stream, `http://${this.record.host}`)
      if (url.protocol === 'http:' || url.protocol === 'https:') this.setStatus({ cameraUrl: url.href })
    } catch {}
  }

  private startPolling () {
    if (this.pollTimer) return
    this.setStatus({ state: 'connecting' })
    this.poll().catch(() => {})
    this.pollTimer = setInterval(() => { this.poll().catch(() => {}) }, 3000)
  }

  private async poll () {
    try {
      const [job, printer] = await Promise.all([
        fetchJson(this.deps, httpUrl(this.record.host, '/api/job'), {}, this.credentials?.apiKey),
        fetchJson(this.deps, httpUrl(this.record.host, '/api/printer'), {}, this.credentials?.apiKey)
      ])
      const state = printer.state ?? {}
      const flags = state.flags ?? {}
      const temps = printer.temperature ?? {}
      this.setStatus({
        state: flags.paused ? 'paused' : flags.error ? 'error' : flags.printing ? 'printing' : 'idle',
        message: state.text ?? null,
        file: job.job?.file?.path ?? job.job?.file?.name ?? null,
        progress: clampProgress(job.progress?.completion, true),
        timeLeft: typeof job.progress?.printTimeLeft === 'number' ? job.progress.printTimeLeft : null,
        temps: [temp('nozzle', temps.tool0?.actual, temps.tool0?.target), temp('bed', temps.bed?.actual, temps.bed?.target)]
          .filter((item): item is NonNullable<typeof item> => item !== null)
      })
    } catch {
      this.setStatus({ state: 'offline' })
    }
  }

  private async command (body: object) {
    await fetchJson(this.deps, httpUrl(this.record.host, '/api/job'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }, this.credentials?.apiKey)
  }

  pause (): Promise<void> { return this.command({ command: 'pause', action: 'pause' }) }
  resume (): Promise<void> { return this.command({ command: 'pause', action: 'resume' }) }
  stop (): Promise<void> { return this.command({ command: 'cancel' }) }

  async listFiles (): Promise<ForeignFile[]> {
    const response = await fetchJson(this.deps, httpUrl(this.record.host, '/api/files/local?recursive=true'), {}, this.credentials?.apiKey)
    return (response?.files ?? []).map((file: any) => ({
      path: file.path,
      name: file.name,
      size: file.size,
      modified: file.date
    }))
  }

  printFile (path: string): Promise<void> {
    return this.fileCommand(path, { command: 'select', print: true })
  }

  private async fileCommand (path: string, body: object) {
    await fetchJson(this.deps, httpUrl(this.record.host, `/api/files/local/${path.split('/').map(encodeURIComponent).join('/')}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }, this.credentials?.apiKey)
  }

  async upload (file: File | Blob, name: string, print: boolean): Promise<void> {
    const form = new FormData()
    form.append('file', file, name)
    if (print) form.append('print', 'true')
    const headers = this.credentials?.apiKey ? { 'X-Api-Key': this.credentials.apiKey } : undefined
    const response = await this.deps.fetch(httpUrl(this.record.host, '/api/files/local'), {
      method: 'POST',
      body: form,
      headers,
      cache: 'no-store'
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    await response.json()
  }

  close () {
    if (this.pollTimer) clearInterval(this.pollTimer)
    this.pollTimer = null
    super.close()
  }
}
