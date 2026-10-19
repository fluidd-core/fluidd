import { afterEach, expect, it, vi } from 'vitest'
import { actions } from '@/store/charts/actions'
import { WebSocketClient } from '@/plugins/socketClient'
import { cloudState } from '@/services/muon-cloud/state'
vi.mock('@/api/socketActions', () => ({ SocketActions: {} }))
afterEach(() => { cloudState.activePrinterId = null })
it('loads only returned Moonraker samples without padding or mutating the response', async () => {
  const payload = { extruder: { temperatures: [210, 211], targets: [215, 215] } }
  const commit = vi.fn()
  await (actions.initTempStore as any)({ commit, rootGetters: { 'charts/getChartRetention': 1200 }, rootState: { printer: { printer: { extruder: {} } } } }, payload)
  expect(commit.mock.calls[0][1]).toHaveLength(2)
  expect(payload.extruder.temperatures).toEqual([210, 211])
})

it('refuses retained history whose captured printer session has gone stale', async () => {
  const commit = vi.fn()
  const rootState = { config: { apiUrl: 'http://printer-b' }, socket: { connectionId: 'session-b' }, printer: { printer: { extruder: {} } } }
  const deferredFromPrinterA = {
    payload: { extruder: { temperatures: [190] } },
    requestContext: { apiUrl: 'http://printer-a', connectionId: 'session-a', printerId: null, connectionAttempt: 1 }
  }
  await (actions.initTempStore as any)({ commit, rootGetters: { 'charts/getChartRetention': 1200 }, rootState }, deferredFromPrinterA)
  expect(commit).not.toHaveBeenCalled()
})

it('captures cloud printer identity through the socket send/receive path', async () => {
  const commit = vi.fn()
  const state = {
    config: { apiUrl: 'https://cloud.example' },
    socket: { connectionId: 'shared-session', disconnecting: false, connecting: false, stalled: false },
    files: { download: false },
    printer: { printer: { extruder: {} } }
  }
  const dispatch = vi.fn(async (name: string, payload?: unknown) => {
    if (name === 'charts/initTempStore') await (actions.initTempStore as any)({ commit, rootGetters: { 'charts/getChartRetention': 1200 }, rootState: state }, payload)
  })
  const listeners: Record<string, (event: any) => void> = {}
  const socket = { readyState: 1, send: vi.fn(), close: vi.fn(), addEventListener: vi.fn((name, listener) => { listeners[name] = listener }) }
  const client = new WebSocketClient({ url: '', store: { state, dispatch, commit: vi.fn() } } as never)
  cloudState.activePrinterId = 'printer-a'
  client.adoptTransportSocket(socket as never)
  client.emit('server.temperature_store', { dispatch: 'charts/initTempStore', captureContext: true })
  const id = JSON.parse(socket.send.mock.calls[0][0]).id

  cloudState.activePrinterId = 'printer-b'
  listeners.message({ data: JSON.stringify({ jsonrpc: '2.0', id, result: { extruder: { temperatures: [190] } } }) })

  expect(dispatch).toHaveBeenCalledWith('charts/initTempStore', expect.objectContaining({
    requestContext: expect.objectContaining({ printerId: 'printer-a', connectionAttempt: 1 })
  }))
  expect(commit).not.toHaveBeenCalled()
})
