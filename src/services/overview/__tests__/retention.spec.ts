import { expect, it, vi } from 'vitest'
import { actions } from '@/store/charts/actions'
vi.mock('@/api/socketActions', () => ({ SocketActions: {} }))
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
    requestContext: { apiUrl: 'http://printer-a', connectionId: 'session-a' }
  }
  await (actions.initTempStore as any)({ commit, rootGetters: { 'charts/getChartRetention': 1200 }, rootState }, deferredFromPrinterA)
  expect(commit).not.toHaveBeenCalled()
})
