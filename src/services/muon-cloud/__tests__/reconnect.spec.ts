import Vue from 'vue'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cloudApi, CloudError, storeToken, type CloudPrinter } from '../api'
import { WebSocketClient } from '@/plugins/socketClient'
import * as state from '../state'

const fake = vi.hoisted(() => ({
  down: false,
  dials: 0,
  closes: 0,
  sockets: [] as any[],
  grantTimes: [] as number[],
  fetchPause: null as Promise<void> | null
}))

vi.mock('../iroh', async () => {
  const actual = await vi.importActual<typeof import('../iroh')>('../iroh')
  const endpoint = {
    endpointId: () => 'browser',
    async connect () {
      fake.dials++
      if (fake.down) throw new Error('connection lost')
      let closed = false
      return {
        printerId: () => 'boxwood',
        async fetch () {
          if (fake.down || closed) throw new Error('connection lost')
          if (fake.fetchPause) await fake.fetchPause
          return {
            status: 200,
            headers: [],
            body: new TextEncoder().encode(JSON.stringify({
              result: { status: { webhooks: { state: 'ready' }, print_stats: { state: 'printing', filename: 'part.gcode' }, virtual_sdcard: { progress: 0.42 } } }
            }))
          }
        },
        async openWebSocket () { throw new Error('use the endpoint socket fake') },
        close () { closed = true; fake.closes++ }
      }
    }
  }
  return {
    ...actual,
    browserEndpoint: async () => endpoint,
    managedEndpointFactory: async () => ({
      async openRelay () {
        const printer = new actual.IrohPrinter(await endpoint.connect())
        return {
          fetch: (path: string, init?: RequestInit) => printer.fetch(path, init),
          async openWebSocket () {
            if (fake.down) throw new Error('connection lost')
            const listeners = new Map<string, Array<(event: any) => void>>()
            const socket = {
              readyState: 1,
              send () {},
              emit (name: string, event: any) { if (name === 'close') this.readyState = 3; for (const fn of listeners.get(name) ?? []) fn(event) },
              close () { this.emit('close', { code: 1000, reason: '', wasClean: true }) },
              addEventListener: (name: string, fn: any) => listeners.set(name, [...(listeners.get(name) ?? []), fn])
            }
            fake.sockets.push(socket)
            return socket
          },
          close: () => printer.close()
        }
      },
      close () {}
    })
  }
})
vi.mock('@/store', () => ({ default: { state: { config: { hostConfig: {} } } } }))
vi.mock('@/init', () => ({ appInit: vi.fn(async () => ({})) }))
// Adopted Iroh sockets do not ask Moonraker for a LAN one-shot token.
vi.mock('@/api/httpClientActions', () => ({ httpClientActions: { accessOneshotTokenGet: async () => { throw new Error('Unexpected LAN token request') } } }))
vi.mock('@/services/managed-session/httpTransportBinding', () => ({ bindHttpClientToPrinterTransport: () => () => {} }))
vi.mock('../centralLogin', async () => ({ ...await vi.importActual<any>('../centralLogin'), centralLoginEnabled: () => false }))

const printer: CloudPrinter = { id: 'boxwood', name: 'Boxwood', model: 'M1', version: '1', linked_at: 1, last_seen: 0, online: true, online_since: 1 }

beforeEach(async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-13T12:00:00Z'))
  fake.down = false
  fake.dials = fake.closes = 0
  fake.sockets = []
  fake.grantTimes = []
  fake.fetchPause = null
  // Start with no printers so each test controls the first status poll.
  storeToken('test-session')
  vi.spyOn(cloudApi, 'me').mockResolvedValue({ account: { id: 'account', name: 'Jack', email: 'jack@example.test', created_at: 1 }, endpoint_id: null })
  vi.spyOn(cloudApi, 'printers').mockResolvedValue({ printers: [] })
  vi.spyOn(cloudApi, 'getLayout').mockResolvedValue({ layout: {} })
  vi.spyOn(cloudApi, 'config').mockResolvedValue({ relay_url: 'https://relay.example.test', orchestrator_id: 'console', authority_key: 'authority' })
  vi.spyOn(cloudApi, 'registerEndpoint').mockResolvedValue({ endpoint_id: 'browser' })
  vi.spyOn(cloudApi, 'access').mockImplementation(async () => {
    fake.grantTimes.push(Date.now())
    if (fake.down) throw new CloudError('printer temporarily unavailable', 503)
    return { printer_id: 'boxwood', relay_url: 'https://relay.example.test', role: 'operator', grant_id: 'grant', expires_at: Date.now() / 1000 + 3600 }
  })
  await state.initCloud()
  state.cloudState.printers = [{ ...printer, last_seen: Date.now() / 1000 }]
  vi.mocked(cloudApi.printers).mockImplementation(async () => ({ printers: state.cloudState.printers }))
  ;(Vue as any).$socket = { releaseTransportSocket () {}, adoptTransportSocket () {} }
}, 60000)

afterEach(async () => {
  vi.spyOn(cloudApi, 'signOut').mockResolvedValue({ ok: true })
  await state.signOut()
  vi.restoreAllMocks()
  vi.useRealTimers()
  localStorage.clear()
})

it('pollOne retains cached state through online flapping and uses the existing connection', async () => {
  await vi.advanceTimersByTimeAsync(3000)
  expect(state.cloudState.status.boxwood).toMatchObject({ reachable: true, progress: 0.42 })
  state.cloudState.printers[0].online = false
  await vi.advanceTimersByTimeAsync(3000)
  expect(state.cloudState.status.boxwood).toMatchObject({ reachable: false, error: 'reconnecting', progress: 0.42, filename: 'part.gcode' })
  state.cloudState.printers[0].online = true
  await vi.advanceTimersByTimeAsync(3000)
  expect(state.cloudState.status.boxwood.reachable).toBe(true)
  expect(fake.dials).toBe(1)
})

it('marks a console-offline printer Offline only at two minutes since last_seen', async () => {
  state.cloudState.printers[0].online = false
  await vi.advanceTimersByTimeAsync(119000)
  expect(state.cloudState.status.boxwood.error).toBe('reconnecting')
  await vi.advanceTimersByTimeAsync(1000)
  expect(state.cloudState.status.boxwood.error).toBe('offline')
})

it('uses one grant and one connection for status polling plus the dashboard', async () => {
  const { activateCloudPrinter } = await import('../activate')
  await Promise.all([vi.advanceTimersByTimeAsync(3000), activateCloudPrinter('boxwood')])
  expect(state.cloudState.status.boxwood.reachable).toBe(true)
  expect(fake.sockets).toHaveLength(1)
  expect(fake.dials).toBe(1)
  expect(cloudApi.access).toHaveBeenCalledTimes(1)
  // Reopening the page releases its socket, not the fleet's connection.
  await activateCloudPrinter('boxwood')
  await vi.advanceTimersByTimeAsync(3000)
  expect(fake.dials).toBe(1)
  expect(fake.closes).toBe(0)
})

it('retries a 503 grant at 1, 2, 4, 8, then 15 seconds and recovers a 60 second drop without a reload', async () => {
  await vi.advanceTimersByTimeAsync(3000)
  const connection = await state.cloudPrinterConnection('boxwood')
  fake.down = true
  state.cloudState.printers[0].online = false
  const start = Date.now()
  const recovered = state.requestAccess('boxwood')
  recovered.catch(() => {})
  await vi.advanceTimersByTimeAsync(59999)
  expect(fake.grantTimes.slice(1).map(t => t - start)).toEqual([0, 1000, 3000, 7000, 15000, 30000, 45000])
  expect(state.cloudState.status.boxwood).toMatchObject({ reachable: false, error: 'reconnecting', progress: 0.42 })
  fake.down = false
  state.cloudState.printers[0].online = true
  await vi.advanceTimersByTimeAsync(1)
  await recovered
  await vi.advanceTimersByTimeAsync(3000)
  expect(state.cloudState.status.boxwood).toMatchObject({ reachable: true, progress: 0.42 })
  expect(await state.cloudPrinterConnection('boxwood')).toBe(connection)
})

it('does not retry non-503 grant errors', async () => {
  vi.mocked(cloudApi.access).mockRejectedValue(new CloudError('forbidden', 403))
  await expect(state.requestAccess('boxwood')).rejects.toMatchObject({ status: 403 })
  expect(cloudApi.access).toHaveBeenCalledTimes(1)
})

it('discards a page\'s late HTTP answer after it closes while the shared connection stays usable', async () => {
  await vi.advanceTimersByTimeAsync(3000)
  const page = await state.borrowCloudPrinter('boxwood')
  let finish!: () => void
  fake.fetchPause = new Promise<void>(resolve => { finish = resolve })
  const oldRead = expect(page.fetch('/server/info')).rejects.toThrow('Printer page closed')
  page.close()
  finish()
  await oldRead
  fake.fetchPause = null
  const shared = await state.cloudPrinterConnection('boxwood')
  expect((await shared.fetch('/server/info')).ok).toBe(true)
  expect(fake.dials).toBe(1)
  expect(fake.closes).toBe(0)
})

it('restores the dashboard socket and cached status after a simulated 60 second drop', async () => {
  const socketState = { open: false, connecting: false, disconnecting: false, stalled: false }
  const store = {
    state: { socket: socketState, files: { download: false } },
    dispatch: async (name: string, payload?: any) => {
      if (name === 'socket/onSocketOpen') socketState.open = payload
      if (name === 'socket/onSocketConnecting') socketState.connecting = payload
      if (name === 'socket/onSocketClose') socketState.open = false
    },
    commit: (name: string, payload?: any) => {
      if (name === 'socket/setSocketOpen') socketState.open = payload
      if (name === 'socket/setSocketStalled') socketState.stalled = payload
    }
  }
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
  const client = new WebSocketClient({ url: '', store, reconnectEnabled: true, reconnectInterval: 1000 } as never)
  try {
    const shared = await state.cloudPrinterConnection('boxwood')
    const first = await shared.openWebSocket('/websocket')
    client.adoptTransportSocket(first, () => shared.openWebSocket('/websocket'))
    await vi.advanceTimersByTimeAsync(3000)
    expect(fake.dials).toBe(1)
    fake.down = true
    state.cloudState.printers[0].online = false
    fake.sockets[0].emit('close', { code: 1006, reason: 'network lost', wasClean: false })
    await vi.advanceTimersByTimeAsync(59999)
    expect(socketState.open).toBe(false)
    expect(state.cloudState.status.boxwood).toMatchObject({ error: 'reconnecting', progress: 0.42, filename: 'part.gcode' })
    fake.down = false
    state.cloudState.printers[0].online = true
    await vi.advanceTimersByTimeAsync(1)
    // The outstanding grant's capped backoff and the socket retry complete.
    await vi.advanceTimersByTimeAsync(15000)
    expect(socketState.open).toBe(true)
    expect(state.cloudState.status.boxwood.reachable).toBe(true)
    expect(await state.cloudPrinterConnection('boxwood')).toBe(shared)
    expect(fake.sockets).toHaveLength(2)
  } finally {
    client.releaseTransportSocket()
    client.close()
  }
})

it('cancels outstanding 503 retries when the account signs out', async () => {
  fake.down = true
  const pending = state.requestAccess('boxwood')
  const cancelled = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  await vi.advanceTimersByTimeAsync(1000)
  vi.spyOn(cloudApi, 'signOut').mockResolvedValue({ ok: true })
  await state.signOut()
  await cancelled
  const attempts = fake.grantTimes.length
  await vi.advanceTimersByTimeAsync(60000)
  expect(fake.grantTimes).toHaveLength(attempts)
  expect(state.cloudState.status).toEqual({})
})
