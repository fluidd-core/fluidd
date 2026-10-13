// @vitest-environment node
import { createServer } from 'node:http'
import { once } from 'node:events'
import { WebSocket as NodeWebSocket, WebSocketServer } from 'ws'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { capabilitiesFor, createAdapter } from '../adapters'
import type { ForeignKind, ForeignPrinterRecord, ForeignStatus } from '../types'

vi.mock('@/services/muon-cloud/discovery', () => ({
  lanFetch: (url: string, init?: RequestInit) => fetch(url, init)
}))

const servers: Array<() => Promise<void>> = []
const kinds = ['moonraker', 'octoprint', 'creality', 'elegoo-cc'] as const

async function fakePrinter (kind: ForeignKind) {
  const requests: Array<{ method: string, url: string, body: string, apiKey: string | undefined }> = []
  const socketMessages: string[] = []
  const sdcpRequests: any[] = []
  const heartbeatReplies: string[] = []
  const clients = new Set<import('ws').WebSocket>()
  const ackByCommand = new Map<number, number>()
  let subprotocol: string | undefined
  let echoRequestId = true
  let port = 0
  const server = createServer((request, response) => {
    let body = ''
    request.on('data', chunk => { body += chunk })
    request.on('end', () => {
      const url = new URL(request.url ?? '/', 'http://printer')
      requests.push({
        method: request.method ?? 'GET',
        url: `${url.pathname}${url.search}`,
        body,
        apiKey: request.headers['x-api-key'] as string | undefined
      })
      response.setHeader('Content-Type', 'application/json')
      if (url.pathname === '/server/webcams/list') response.end(JSON.stringify({ result: { webcams: [] } }))
      else if (url.pathname === '/api/login') {
        const passive = request.method === 'POST' && JSON.parse(body || '{}').passive === true
        response.statusCode = passive ? 200 : request.method === 'POST' ? 400 : 405
        response.end(JSON.stringify(passive ? { name: 'local', session: 'session' } : {}))
      } else if (url.pathname === '/api/settings') response.end(JSON.stringify({ webcam: {} }))
      else if (request.method === 'POST' && url.pathname.startsWith('/api/')) { response.statusCode = 204; response.end() } else if (url.pathname === '/api/job') response.end(JSON.stringify({ job: { file: { name: 'part.gcode' } }, progress: {} }))
      else if (url.pathname === '/api/printer') response.end(JSON.stringify({ state: { text: 'Operational', flags: { ready: true } } }))
      else if (url.pathname === '/api/files/local') response.end(JSON.stringify({ files: [] }))
      else response.end(JSON.stringify({}))
    })
  })
  const sockets = new WebSocketServer({ noServer: true })
  server.on('upgrade', (request, socket, head) => {
    subprotocol = request.headers['sec-websocket-protocol']
    sockets.handleUpgrade(request, socket, head, client => {
      clients.add(client)
      client.on('message', raw => {
        const text = raw.toString()
        socketMessages.push(text)
        if (text === 'ok') heartbeatReplies.push(text)
        if (kind !== 'elegoo-cc') return
        let envelope: any
        try { envelope = JSON.parse(text) } catch { return }
        const cmd = Number(envelope.Data?.Cmd)
        if (Number.isNaN(cmd)) return
        sdcpRequests.push(envelope)
        if (![129, 131, 130, 128, 258].includes(cmd)) return
        const data: Record<string, unknown> = { Ack: ackByCommand.get(cmd) ?? 0 }
        if (cmd === 258) data.Files = [{ Path: '/local/latest.gcode', Name: 'latest.gcode' }]
        const responseData: Record<string, unknown> = { Cmd: cmd, Data: data }
        if (echoRequestId) responseData.RequestID = envelope.Data.RequestID
        client.send(JSON.stringify({
          Topic: 'sdcp/response/mainboard-1',
          Data: responseData
        }))
      })
    })
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Fake printer did not bind')
  port = address.port

  class LocalWebSocket extends NodeWebSocket {
    constructor (url: string | URL, protocols?: string | string[]) {
      const original = new URL(String(url))
      super(`ws://127.0.0.1:${port}${original.pathname}`, protocols)
    }
  }

  const fixture = {
    host: `127.0.0.1:${port}`,
    WebSocket: LocalWebSocket as unknown as typeof globalThis.WebSocket,
    requests,
    socketMessages,
    sdcpRequests,
    heartbeatReplies,
    clients,
    push (message: unknown) {
      for (const client of clients) client.send(JSON.stringify(message))
    },
    ackByCommand,
    get subprotocol () { return subprotocol },
    get echoRequestId () { return echoRequestId },
    set echoRequestId (value: boolean) { echoRequestId = value },
    pushStatus (state: 'printing' | 'paused' | 'idle' | 'error') {
      const payload = kind === 'moonraker'
        ? {
            method: 'notify_status_update',
            params: [{ print_stats: { state }, virtual_sdcard: { progress: 0.25 } }]
          }
        : kind === 'octoprint'
          ? {
              current: {
                state: {
                  text: state === 'printing' ? 'Printing' : state === 'paused' ? 'Paused' : state === 'error' ? 'Error' : 'Operational',
                  flags: { printing: state === 'printing', paused: state === 'paused', error: state === 'error', ready: state === 'idle' }
                },
                progress: { completion: 25 }
              }
            }
          : kind === 'creality'
            ? {
                state: state === 'printing' ? 1 : state === 'paused' ? 5 : 0,
                err: { errcode: state === 'error' ? 1 : 0, errinfo: 'Printer fault' }
              }
            : {
                MainboardID: 'mainboard-1',
                Topic: 'sdcp/status/mainboard-1',
                Status: {
                  CurrentStatus: [state === 'idle' ? 0 : 1],
                  PrintInfo: { Status: state === 'printing' ? 13 : state === 'paused' ? 6 : state === 'error' ? 14 : 0 }
                }
              }
      for (const client of clients) client.send(JSON.stringify(payload))
    },
    sendHeartbeat () {
      for (const client of clients) client.send(JSON.stringify({ ModeCode: 'heart_beat' }))
    },
    closeSockets () {
      for (const client of clients) client.close()
    }
  }

  servers.push(async () => {
    for (const client of sockets.clients) client.close()
    await new Promise<void>(resolve => sockets.close(() => resolve()))
    await new Promise<void>(resolve => server.close(() => resolve()))
  })
  return fixture
}

const recordFor = (kind: ForeignKind, host: string): ForeignPrinterRecord => ({
  id: kind,
  kind,
  name: kind,
  host,
  via: 'direct',
  formFactor: 'bed-slinger',
  credentialsRef: null,
  addedAt: Date.now()
})

const adapters = {
  moonraker: { pauseResume: true, stop: true, camera: true, listFiles: true, printFromStorage: true, upload: true },
  octoprint: { pauseResume: true, stop: true, camera: true, listFiles: true, printFromStorage: true, upload: true },
  creality: { pauseResume: true, stop: true, camera: true, listFiles: false, printFromStorage: false, upload: false },
  'elegoo-cc': { pauseResume: true, stop: true, camera: true, listFiles: true, printFromStorage: true, upload: false }
}

async function waitFor (predicate: () => boolean) {
  const deadline = Date.now() + 1500
  while (!predicate() && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 10))
  if (!predicate()) throw new Error('Timed out waiting for the fake printer')
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map(close => close()))
})

describe('foreign adapters against local HTTP and WebSocket printers', () => {
  it('authenticates the OctoPrint push socket with an application key and passive login', async () => {
    const fixture = await fakePrinter('octoprint')
    const adapter = createAdapter(recordFor('octoprint', fixture.host), { apiKey: 'app-key' }, { fetch, WebSocket: fixture.WebSocket })
    try {
      await adapter.connect()
      await waitFor(() => fixture.socketMessages.some(message => JSON.parse(message).auth === 'local:session'))
      const login = fixture.requests.find(request => request.url === '/api/login')
      expect(login).toMatchObject({ method: 'POST', apiKey: 'app-key' })
      expect(JSON.parse(login!.body)).toEqual({ passive: true })
      expect(fixture.requests.some(request => request.url === '/api/printer')).toBe(false)
    } finally { adapter.close() }
  })

  it('keeps a published local RTSP camera URL for a camera player', async () => {
    const fixture = await fakePrinter('elegoo-cc')
    const adapter = createAdapter(recordFor('elegoo-cc', fixture.host), null, { fetch, WebSocket: fixture.WebSocket })
    try {
      await adapter.connect()
      fixture.push({ Status: { CurrentStatus: [1], PrintInfo: { Status: 13 } }, VideoUrl: 'rtsp://192.168.1.25:8554/live' })
      await waitFor(() => adapter.status.state === 'printing')
      expect(adapter.status.cameraUrl).toBe('rtsp://192.168.1.25:8554/live')
    } finally { adapter.close() }
  })

  it('can send SDCP controls from a plain HTTP origin without randomUUID', async () => {
    const fixture = await fakePrinter('elegoo-cc')
    const adapter = createAdapter(recordFor('elegoo-cc', fixture.host), null, { fetch, WebSocket: fixture.WebSocket })
    try {
      await adapter.connect()
      vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) })
      await expect(Promise.resolve().then(() => adapter.pause())).resolves.toBeUndefined()
    } finally { adapter.close(); vi.unstubAllGlobals() }
  })

  it('maps Centauri FDM checking, pause, completion, stop and numeric errors', async () => {
    const fixture = await fakePrinter('elegoo-cc')
    const adapter = createAdapter(recordFor('elegoo-cc', fixture.host), null, { fetch, WebSocket: fixture.WebSocket })
    try {
      await adapter.connect()
      for (const [code, want] of [[10, 'printing'], [6, 'paused'], [9, 'idle'], [8, 'idle'], [14, 'error']] as const) {
        fixture.push({ MainboardID: 'mainboard-1', Status: { CurrentStatus: [1], PrintInfo: { Status: code, CurrentTicks: 100, TotalTicks: 400 } } })
        await waitFor(() => adapter.status.state === want)
        expect(adapter.status.timeLeft).toBe(300)
      }
      fixture.push({ Status: { CurrentStatus: [0], PrintInfo: { Status: 13 } } })
      await waitFor(() => adapter.status.state === 'idle')
    } finally { adapter.close() }
  })

  it('rejects public direct records before opening a connection', () => {
    expect(() => createAdapter(recordFor('octoprint', 'printer.example.com'), { apiKey: 'local-key' }, {
      fetch, WebSocket: NodeWebSocket as unknown as typeof globalThis.WebSocket
    })).toThrow(/local network/)
  })

  it('uses the newest OctoPrint temperature sample and retains it between samples', async () => {
    const fixture = await fakePrinter('octoprint')
    const adapter = createAdapter(recordFor('octoprint', fixture.host), null, { fetch, WebSocket: fixture.WebSocket })
    try {
      await adapter.connect()
      fixture.push({
        current: {
          state: { flags: { printing: true } },
          progress: { completion: 60 },
          temps: [
            { tool0: { actual: 199, target: 210 }, bed: { actual: 50, target: 60 } },
            { tool0: { actual: 209, target: 210 }, bed: { actual: 59, target: 60 } }
          ]
        }
      })
      await waitFor(() => adapter.status.state === 'printing')
      const expected = [{ id: 'nozzle', actual: 209, target: 210 }, { id: 'bed', actual: 59, target: 60 }]
      expect(adapter.status.temps).toEqual(expected)
      fixture.push({ current: { state: { flags: { printing: true } }, progress: { completion: 61 }, temps: [] } })
      await waitFor(() => adapter.status.progress === 0.61)
      expect(adapter.status.temps).toEqual(expected)
    } finally { adapter.close() }
  })

  it('does not invent a Creality camera and ignores a public camera URL', async () => {
    const fixture = await fakePrinter('creality')
    const adapter = createAdapter(recordFor('creality', fixture.host), null, { fetch, WebSocket: fixture.WebSocket })
    try {
      await adapter.connect()
      expect(adapter.status.cameraUrl).toBeNull()
      fixture.push({ cameraUrl: 'https://camera.example/stream', state: 1 })
      await waitFor(() => adapter.status.state === 'printing')
      expect(adapter.status.cameraUrl).toBeNull()
      fixture.push({ cameraUrl: 'http://192.168.1.9:8080/stream' })
      await waitFor(() => adapter.status.cameraUrl !== null)
      expect(adapter.status.cameraUrl).toBe('http://192.168.1.9:8080/stream')
    } finally { adapter.close() }
  })

  it('preserves Moonraker state and targets across incremental temperature and progress updates', async () => {
    const fixture = await fakePrinter('moonraker')
    const adapter = createAdapter(recordFor('moonraker', fixture.host), { apiKey: 'local-key' }, { fetch, WebSocket: fixture.WebSocket })
    try {
      await adapter.connect()
      fixture.push({
        result: {
          status: {
            print_stats: { state: 'printing', filename: 'part.gcode', print_duration: 100 },
            virtual_sdcard: { progress: 0.25 },
            extruder: { temperature: 210, target: 215 },
            heater_bed: { temperature: 59, target: 60 }
          }
        }
      })
      await waitFor(() => adapter.status.state === 'printing')
      fixture.push({ method: 'notify_status_update', params: [{ extruder: { temperature: 212 }, virtual_sdcard: { progress: 0.5 } }, 20] })
      await waitFor(() => adapter.status.progress === 0.5)
      expect(adapter.status).toMatchObject({
        state: 'printing',
        file: 'part.gcode',
        timeLeft: 100,
        temps: [{ id: 'nozzle', actual: 212, target: 215 }, { id: 'bed', actual: 59, target: 60 }]
      })
      fixture.push({ method: 'notify_gcode_response', params: ['ok'] })
      await new Promise(resolve => setTimeout(resolve, 20))
      expect(adapter.status.state).toBe('printing')
      await waitFor(() => fixture.socketMessages.length >= 2)
      expect(JSON.parse(fixture.socketMessages[0])).toMatchObject({ method: 'server.connection.identify', params: { api_key: 'local-key' } })
      expect(JSON.parse(fixture.socketMessages[1])).toMatchObject({ method: 'printer.objects.subscribe', params: { objects: { print_stats: null } } })
    } finally { adapter.close() }
  })

  it('reports Moonraker shutdown and subscription errors instead of Ready', async () => {
    const fixture = await fakePrinter('moonraker')
    const adapter = createAdapter(recordFor('moonraker', fixture.host), null, { fetch, WebSocket: fixture.WebSocket })
    try {
      await adapter.connect()
      fixture.push({ method: 'notify_klippy_shutdown' })
      await waitFor(() => adapter.status.state === 'error')
      fixture.push({ error: { code: 401, message: 'Unauthorized' }, id: 2 })
      await waitFor(() => adapter.status.message === 'Unauthorized')
      expect(adapter.status.state).toBe('error')
    } finally { adapter.close() }
  })

  it('reads the camera and keeps REST status when the OctoPrint push socket is blocked', async () => {
    const fixture = await fakePrinter('octoprint')
    class BlockedWebSocket { constructor () { throw new Error('Mixed content') } }
    const adapter = createAdapter(recordFor('octoprint', fixture.host), { apiKey: 'local-key' }, {
      fetch, WebSocket: BlockedWebSocket as unknown as typeof WebSocket
    })
    try {
      await adapter.connect()
      expect(adapter.status).toMatchObject({ state: 'idle', file: 'part.gcode' })
      await waitFor(() => fixture.requests.some(request => request.url === '/api/settings'))
      await expect(adapter.stop()).resolves.toBeUndefined()
    } finally { adapter.close() }
  })

  it.each(kinds)('%s maps printing, paused, idle and error states, then goes offline on close', async kind => {
    const fixture = await fakePrinter(kind)
    const adapter = createAdapter(recordFor(kind, fixture.host), null, {
      fetch,
      WebSocket: fixture.WebSocket
    })
    try {
      expect(adapter.capabilities).toEqual(adapters[kind])
      expect(capabilitiesFor(kind)).toEqual(adapters[kind])
      await adapter.connect()
      let latest: ForeignStatus = adapter.status
      adapter.onStatus(status => { latest = status })
      for (const state of ['printing', 'paused', 'idle', 'error'] as const) {
        fixture.pushStatus(state)
        await waitFor(() => latest.state === state)
      }
      fixture.closeSockets()
      await waitFor(() => latest.state === 'offline')
    } finally {
      adapter.close()
    }
  })

  it('sends Moonraker pause, resume and stop to their POST paths', async () => {
    const fixture = await fakePrinter('moonraker')
    const adapter = createAdapter(recordFor('moonraker', fixture.host), null, {
      fetch,
      WebSocket: fixture.WebSocket
    })
    try {
      await adapter.connect()
      await adapter.pause()
      await adapter.resume()
      await adapter.stop()
      expect(fixture.requests.filter(request => request.method === 'POST')).toEqual([
        expect.objectContaining({ url: '/printer/print/pause', body: '{}' }),
        expect.objectContaining({ url: '/printer/print/resume', body: '{}' }),
        expect.objectContaining({ url: '/printer/print/cancel', body: '{}' })
      ])
    } finally {
      adapter.close()
    }
  })

  it('sends OctoPrint job commands with the API key', async () => {
    const fixture = await fakePrinter('octoprint')
    const adapter = createAdapter(recordFor('octoprint', fixture.host), { apiKey: 'local-key' }, {
      fetch,
      WebSocket: fixture.WebSocket
    })
    try {
      await adapter.connect()
      await adapter.pause()
      await adapter.resume()
      await adapter.stop()
      expect(fixture.requests.filter(request => request.method === 'POST' && request.url === '/api/job')).toEqual([
        expect.objectContaining({ url: '/api/job', body: '{"command":"pause","action":"pause"}', apiKey: 'local-key' }),
        expect.objectContaining({ url: '/api/job', body: '{"command":"pause","action":"resume"}', apiKey: 'local-key' }),
        expect.objectContaining({ url: '/api/job', body: '{"command":"cancel"}', apiKey: 'local-key' })
      ])
    } finally {
      adapter.close()
    }
  })

  it('uses the Creality subprotocol, answers heartbeats, and sends set commands', async () => {
    const fixture = await fakePrinter('creality')
    const adapter = createAdapter(recordFor('creality', fixture.host), null, {
      fetch,
      WebSocket: fixture.WebSocket
    })
    try {
      await adapter.connect()
      expect(fixture.subprotocol).toBe('wsslicer')
      fixture.sendHeartbeat()
      await waitFor(() => fixture.heartbeatReplies.includes('ok'))
      await adapter.pause()
      await adapter.resume()
      await adapter.stop()
      await waitFor(() => fixture.socketMessages.length >= 4)
      expect(fixture.socketMessages).toContain('{"method":"set","params":{"pause":1}}')
      expect(fixture.socketMessages).toContain('{"method":"set","params":{"pause":0}}')
      expect(fixture.socketMessages).toContain('{"method":"set","params":{"stop":1}}')
    } finally {
      adapter.close()
    }
  })

  it('sends acknowledged SDCP commands with the full envelope and learned mainboard id', async () => {
    const fixture = await fakePrinter('elegoo-cc')
    const now = 1_700_000_000_000
    const adapter = createAdapter(recordFor('elegoo-cc', fixture.host), null, {
      fetch,
      WebSocket: fixture.WebSocket,
      now: () => now
    })
    try {
      await adapter.connect()
      fixture.pushStatus('printing')
      await waitFor(() => adapter.status.state === 'printing')
      fixture.pushStatus('idle')
      await waitFor(() => adapter.status.state === 'idle')
      await adapter.pause()
      await adapter.resume()
      await adapter.stop()
      await adapter.printFile!('part.gcode')
      const commands = fixture.sdcpRequests.filter(request => [129, 131, 130, 128].includes(request.Data.Cmd))
      expect(commands).toHaveLength(4)
      expect(commands.map(request => request.Data.Cmd)).toEqual([129, 131, 130, 128])
      for (const command of commands) {
        expect(command).toMatchObject({
          Id: '',
          Data: {
            RequestID: expect.stringMatching(/^[a-f0-9]{32}$/),
            MainboardID: 'mainboard-1',
            TimeStamp: Math.floor(now / 1000),
            From: 1
          },
          Topic: 'sdcp/request/mainboard-1'
        })
      }
      expect(commands.map(request => request.Data.Data)).toEqual([
        {},
        {},
        {},
        { Filename: '/local/part.gcode', StartLayer: 0 }
      ])
    } finally {
      adapter.close()
    }
  })

  it('maps SDCP acknowledgements and waits for a fresh file-list response', async () => {
    const fixture = await fakePrinter('elegoo-cc')
    const adapter = createAdapter(recordFor('elegoo-cc', fixture.host), null, {
      fetch,
      WebSocket: fixture.WebSocket
    })
    try {
      await adapter.connect()
      fixture.pushStatus('printing')
      await waitFor(() => adapter.status.state === 'printing')
      fixture.pushStatus('idle')
      await waitFor(() => adapter.status.state === 'idle')
      fixture.ackByCommand.set(129, 1)
      fixture.echoRequestId = false
      await expect(adapter.pause()).rejects.toThrow('The printer refused')
      fixture.ackByCommand.set(128, 2)
      await expect(adapter.printFile!('missing.gcode')).rejects.toThrow('File not found')
      fixture.ackByCommand.set(258, 0)
      await expect(adapter.listFiles!()).resolves.toEqual([
        { path: '/local/latest.gcode', name: 'latest.gcode' }
      ])
    } finally {
      adapter.close()
    }
  })

  it('does not create direct adapters for bridge-only brands', () => {
    expect(() => createAdapter(recordFor('bambu', '192.168.1.9'), null, {
      fetch, WebSocket: NodeWebSocket as unknown as typeof globalThis.WebSocket
    })).toThrow('requires an M1 bridge')
  })
})
