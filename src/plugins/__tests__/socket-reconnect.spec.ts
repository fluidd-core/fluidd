import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PrinterSocket } from '@/services/managed-transport'

const tokens = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/api/httpClientActions', () => ({ httpClientActions: { accessOneshotTokenGet: tokens.get } }))

// eslint-disable-next-line import/first
import { WebSocketClient } from '../socketClient'

/** A socket the test drives: it opens, talks and closes when told to. */
class FakeSocket implements PrinterSocket {
  readyState = 0
  closedByClient = false
  private readonly listeners = new Map<string, Array<(event: any) => void>>()

  send () {}

  close () {
    this.closedByClient = true
  }

  addEventListener (type: string, listener: (event: any) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener])
  }

  emit (type: string, event: any = {}) {
    if (type === 'open') this.readyState = 1
    if (type === 'close') this.readyState = 3
    this.listeners.get(type)?.forEach(listener => listener(event))
  }

  message () {
    this.emit('message', { data: JSON.stringify({ jsonrpc: '2.0', method: 'notify_proc_stat_update', params: [{}] }) })
  }
}

function fakeStore () {
  const state = {
    socket: { disconnecting: false, connecting: false, open: false, stalled: false },
    files: { download: false }
  }
  return {
    state,
    dispatch: vi.fn(async (name: string, payload?: any) => {
      if (name === 'socket/onSocketConnecting') state.socket.connecting = payload
      if (name === 'socket/onSocketOpen') state.socket.open = payload
    }),
    commit: vi.fn((name: string, payload?: any) => {
      if (name === 'socket/setSocketOpen') state.socket.open = payload
      if (name === 'socket/setSocketStalled') state.socket.stalled = payload
    })
  }
}

let sockets: FakeSocket[] = []
let clients: WebSocketClient[] = []

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0.5) // no jitter: 0.8 + 0.5 * 0.4 = 1
  sockets = []
  tokens.get.mockReset()
  tokens.get.mockResolvedValue({ data: { result: 'token' } })
  vi.stubGlobal('WebSocket', vi.fn(() => {
    const socket = new FakeSocket()
    sockets.push(socket)
    return socket
  }))
})

afterEach(() => {
  // Every client listens for the network coming back: stop the old ones.
  for (const c of clients) c.close()
  clients = []
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function lanClient () {
  const store = fakeStore()
  const client = new WebSocketClient({ url: 'ws://printer/websocket', store, reconnectEnabled: true, reconnectInterval: 1000 } as never)
  clients.push(client)
  return { client, store }
}

async function opened (client: WebSocketClient) {
  await client.connect()
  const socket = sockets[sockets.length - 1]
  socket.emit('open')
  return socket
}

describe('WebSocketClient reconnecting', () => {
  it('purges unanswered requests and waits when reconnecting', async () => {
    const { client, store } = lanClient()
    const socket = await opened(client)
    client.emit('server.temperature_store', { dispatch: 'charts/initTempStore', wait: 'history' })
    expect(client.requests).toHaveLength(1)

    socket.emit('close', { code: 1006, reason: 'lost', wasClean: false })

    expect(client.requests).toHaveLength(0)
    expect(store.commit).toHaveBeenCalledWith('wait/setRemoveWait', 'history')
  })

  it('retries a clean close it did not ask for, and tells the store it was not clean', async () => {
    // Moonraker closes cleanly when it reaps a quiet socket, and over Iroh
    // every close from the printer arrives as clean. Both used to end on
    // "No moonraker connection" with no retry.
    const { client, store } = lanClient()
    const socket = await opened(client)

    socket.emit('close', { code: 1000, reason: '', wasClean: true })
    expect(store.dispatch).toHaveBeenCalledWith('socket/onSocketClose', { code: 1000, reason: '', wasClean: false })
    expect(client.retryPending).toBe(true)

    await vi.advanceTimersByTimeAsync(1000)
    expect(sockets).toHaveLength(2)
  })

  it('says when its next try runs, and forgets it once that try has run', async () => {
    const { client } = lanClient()
    const socket = await opened(client)

    socket.emit('close', { code: 1006, reason: '', wasClean: false })
    const at = client.nextRetryAt
    expect(at).not.toBeNull()
    expect(at! - Date.now()).toBeGreaterThan(0)
    await vi.advanceTimersByTimeAsync(at! - Date.now() + 1)
    expect(client.nextRetryAt).toBeNull()
  })

  it('does not retry a close it asked for', async () => {
    const { client, store } = lanClient()
    const socket = await opened(client)

    client.close()
    socket.emit('close', { code: 1000, reason: '', wasClean: true })

    expect(store.dispatch).toHaveBeenCalledWith('socket/onSocketClose', { code: 1000, reason: '', wasClean: true })
    expect(client.retryPending).toBe(false)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(sockets).toHaveLength(1)
  })

  it('backs off from 1 s, doubling to 30 s, and never gives up', async () => {
    const { client } = lanClient()
    tokens.get.mockRejectedValue(new Error('Network Error'))
    await client.connect()

    const waits = [1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000, 30000]
    for (const [i, wait] of waits.entries()) {
      await vi.advanceTimersByTimeAsync(wait - 1)
      expect(tokens.get).toHaveBeenCalledTimes(i + 1)
      await vi.advanceTimersByTimeAsync(1)
      expect(tokens.get).toHaveBeenCalledTimes(i + 2)
    }
    expect(client.retryPending).toBe(true)
  })

  it('tries again at once when the network comes back, from the first step', async () => {
    const { client } = lanClient()
    tokens.get.mockRejectedValue(new Error('Network Error'))
    await client.connect()
    await vi.advanceTimersByTimeAsync(1000 + 2000 + 4000)
    expect(tokens.get).toHaveBeenCalledTimes(4)

    window.dispatchEvent(new Event('online'))
    await vi.advanceTimersByTimeAsync(0)
    expect(tokens.get).toHaveBeenCalledTimes(5)
    expect(client.nextDelay()).toBe(2000)
  })

  it('keeps the page during a short silence, and only says it is waiting', async () => {
    const { client, store } = lanClient()
    const socket = await opened(client)
    socket.message()
    const connectingBefore = store.dispatch.mock.calls.filter(c => c[0] === 'socket/onSocketConnecting' && c[1] === true).length

    await vi.advanceTimersByTimeAsync(10_500)
    expect(store.state.socket.stalled).toBe(true)
    expect(store.state.socket.open).toBe(true)
    expect(store.dispatch.mock.calls.filter(c => c[0] === 'socket/onSocketConnecting' && c[1] === true))
      .toHaveLength(connectingBefore)

    socket.message()
    expect(store.state.socket.stalled).toBe(false)
  })

  it('replaces a connection that has said nothing for 30 s, without waiting for its close', async () => {
    const { client, store } = lanClient()
    const socket = await opened(client)
    socket.message()

    await vi.advanceTimersByTimeAsync(30_000)
    expect(socket.closedByClient).toBe(true)
    expect(store.dispatch).toHaveBeenCalledWith('socket/onSocketClose', { code: 4000, reason: 'no messages', wasClean: false })

    // The dead socket's own close, when it finally comes, changes nothing.
    socket.emit('close', { code: 1006, reason: '', wasClean: false })
    await vi.advanceTimersByTimeAsync(1000)
    expect(sockets).toHaveLength(2)
  })

  it('keeps watching through a download, and replaces a socket that died during it', async () => {
    const { client, store } = lanClient()
    const socket = await opened(client)
    socket.message()

    // Quiet is expected while a file downloads: no replacement then...
    store.state.files.download = true
    await vi.advanceTimersByTimeAsync(30_000)
    expect(socket.closedByClient).toBe(false)

    // ...but once it is over, a socket that still says nothing is replaced.
    store.state.files.download = false
    await vi.advanceTimersByTimeAsync(30_000)
    expect(socket.closedByClient).toBe(true)
    expect(client.retryPending).toBe(true)
  })

  it('re-opens an adopted transport socket after any close, through the transport', async () => {
    const store = fakeStore()
    const client = new WebSocketClient({ url: '', store } as never)
    clients.push(client)
    const first = new FakeSocket()
    const second = new FakeSocket()
    const reopen = vi.fn(async () => second)

    client.adoptTransportSocket(first, reopen)
    first.emit('open')
    first.emit('close', { code: 1000, reason: '', wasClean: true })

    await vi.advanceTimersByTimeAsync(1000)
    expect(reopen).toHaveBeenCalledTimes(1)
    expect(client.connection).toBe(second)
  })

  it("drops a connect still waiting for its token once another printer's socket is adopted", async () => {
    // 14 Oct: a Walnut connect that outlived a switch to Boxwood would open
    // Walnut's socket under Boxwood's page.
    const { client } = lanClient()
    let token!: (value: unknown) => void
    tokens.get.mockReturnValueOnce(new Promise(resolve => { token = resolve }))
    const waiting = client.connect()

    const boxwood = new FakeSocket()
    client.adoptTransportSocket(boxwood, async () => new FakeSocket())
    token({ data: { result: 'token' } })
    await waiting

    expect(sockets).toHaveLength(0)
    expect(client.connection).toBe(boxwood)
  })

  it('drops a connect still waiting for its token once Fluidd closed it', async () => {
    const { client } = lanClient()
    let token!: (value: unknown) => void
    tokens.get.mockReturnValueOnce(new Promise(resolve => { token = resolve }))
    const waiting = client.connect()

    client.close()
    token({ data: { result: 'token' } })
    await waiting

    expect(sockets).toHaveLength(0)
    expect(client.retryPending).toBe(false)
  })
})
