import { TypedStore } from '@/store'
import { WebSocketClient } from '@/plugins/socketClient'

const sockets: FakeWebSocket[] = []

class FakeWebSocket {
  static readonly OPEN = 1

  readyState = FakeWebSocket.OPEN
  sent: string[] = []

  onopen: (() => void) | null = null
  onclose: ((event: unknown) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  onmessage: ((message: { data: string }) => void) | null = null

  constructor () {
    sockets.push(this)
  }

  send (data: string) {
    this.sent.push(data)
  }

  close () {}
}

const socket = () => sockets[sockets.length - 1]

const onSocketError = vi.fn()
const onSetStatus = vi.fn()

const createSocketStore = () => new TypedStore({
  modules: {
    socket: {
      namespaced: true,
      state: () => ({ status: 'ready' }),
      actions: {
        onSetStatus: (...args: unknown[]) => onSetStatus(...args),
        onSocketError: (...args: unknown[]) => onSocketError(...args)
      }
    },
    config: {
      namespaced: true,
      state: () => ({ socketUrl: 'ws://localhost:7125/websocket' })
    },
    wait: {
      namespaced: true,
      actions: {
        addWait: () => {}
      },
      mutations: {
        setRemoveWait: () => {}
      }
    }
  }
})

/**
 * Answers the last request the client sent with a JSON-RPC error.
 */
const respondWithError = (code: number, message: string) => {
  const { sent, onmessage } = socket()
  const { id } = JSON.parse(sent[sent.length - 1]) as { id: number }

  onmessage?.({
    data: JSON.stringify({
      jsonrpc: '2.0',
      id,
      error: { code, message }
    })
  })
}

describe('WebSocketClient error handling', () => {
  let client: WebSocketClient

  beforeEach(() => {
    onSocketError.mockClear()
    onSetStatus.mockClear()

    vi.stubGlobal('WebSocket', FakeWebSocket)

    client = new WebSocketClient({ store: createSocketStore() })
    client.connect()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('dispatches socket/onSocketError for an ordinary request', async () => {
    const request = client.emit('server.files.delete_file', { params: { path: 'gcodes/a.gcode' } })

    respondWithError(404, 'File not found')

    await expect(request).rejects.toMatchObject({ code: 404 })

    expect(onSocketError).toHaveBeenCalledTimes(1)
    expect(onSocketError.mock.calls[0][1]).toMatchObject({ code: 404, message: 'File not found' })
  })

  it('does not dispatch socket/onSocketError when the request suppresses it', async () => {
    const request = client.emit('server.history.get_job', {
      params: { uid: '00000f' },
      suppressError: true
    })

    respondWithError(404, 'Invalid job uid: 00000f')

    await expect(request).rejects.toMatchObject({ code: 404 })

    expect(onSocketError).not.toHaveBeenCalled()
  })

  it('dispatches socket/onSocketError for a response with no matching request', () => {
    socket().onmessage?.({
      data: JSON.stringify({
        jsonrpc: '2.0',
        id: 999999,
        error: { code: 500, message: 'Internal error' }
      })
    })

    expect(onSocketError).toHaveBeenCalledTimes(1)
  })
})
