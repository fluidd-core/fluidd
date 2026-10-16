import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import FirstLayerNudges from '../FirstLayerNudges.vue'
import { panelStore } from '@/components/control/__tests__/panel-fixture'
import { cloudState } from '@/services/muon-cloud/state'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
const http = vi.hoisted(() => ({ serverDatabaseItemGet: vi.fn(), serverDatabaseItemPost: vi.fn(), serverDatabaseItemDelete: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
vi.mock('@/api/httpClientActions', () => ({ httpClientActions: http }))

const originalLocks = navigator.locks
let database: Record<string, any>

function atPath (key: string, value: unknown) {
  const parts = key.split('.'); let target = database
  for (const part of parts.slice(0, -1)) target = target[part] ??= {}
  target[parts[parts.length - 1]] = value
}

beforeEach(() => {
  database = {}
  http.serverDatabaseItemGet.mockImplementation(async (_namespace: string, options: any) => ({ data: { result: { value: structuredClone(options.params.key.split('.').reduce((v: any, p: string) => v?.[p], database)) } } }))
  http.serverDatabaseItemPost.mockImplementation(async (_namespace: string, key: string, value: unknown) => { atPath(key, value) })
  Object.defineProperty(navigator, 'locks', { configurable: true, value: { request: (_key: string, callback: () => void) => Promise.resolve(callback()) } })
})
afterEach(() => {
  Object.defineProperty(navigator, 'locks', { configurable: true, value: originalLocks })
  socket.printerGcodeScript.mockClear(); http.serverDatabaseItemGet.mockReset(); http.serverDatabaseItemPost.mockReset()
  cloudState.printers = []; cloudState.activePrinterId = null; printerTransportBinding.remote = false
})

function show () {
  const store = panelStore()
  store.state.config.apiUrl = 'https://muon-cloud.invalid'
  Vue.set(store.state, 'history', { jobs: [{ job_id: 'run-1', filename: 'part.gcode', start_time: 100, status: 'in_progress', end_time: null }] })
  Vue.set(store.state.printer.printer, 'print_stats', { filename: 'part.gcode', info: { current_layer: 1 } })
  Vue.set(store.state.printer.printer.gcode_move, 'homing_origin', [0, 0, 0, 0])
  store.getters['printer/getPrinterState'] = 'printing'
  store.getters['printer/getAvailableCommands'] = { SET_GCODE_OFFSET: {} }
  cloudState.printers = [{ id: 'p', role: 'operator', model: 'M1' }] as any
  cloudState.activePrinterId = 'p'; printerTransportBinding.remote = true
  const wrapper = mount(FirstLayerNudges, { mocks: { $store: store, $waits: { onZAdjust: 'adjust' } } })
  return { store, wrapper, vm: wrapper.vm as any }
}

async function nudgeAndReport (device: ReturnType<typeof show>, by: number) {
  await device.vm.nudge(by)
  const origin = device.store.state.printer.printer.gcode_move.homing_origin
  origin.splice(2, 1, Math.round((origin[2] + by) * 100) / 100)
  await Vue.nextTick()
}

it('uses one Moonraker allowance across two devices and opposite directions restore room', async () => {
  const one = show(); const two = show()
  for (let i = 0; i < 5; i++) { await nudgeAndReport(one, 0.01); two.store.state.printer.printer.gcode_move.homing_origin.splice(2, 1, one.vm.reportedOffset) }
  for (let i = 0; i < 5; i++) { await nudgeAndReport(two, 0.01); one.store.state.printer.printer.gcode_move.homing_origin.splice(2, 1, two.vm.reportedOffset) }
  await two.vm.nudge(0.01)
  expect(socket.printerGcodeScript).toHaveBeenCalledTimes(10)
  await nudgeAndReport(two, -0.01)
  await nudgeAndReport(two, 0.01)
  expect(socket.printerGcodeScript).toHaveBeenCalledTimes(12)
  expect(one.vm.databaseKey).toContain('p'); expect(one.vm.databaseKey).toContain('run-1')
  one.wrapper.destroy(); two.wrapper.destroy()
})

it('blocks another device until the printer reports the pending expected offset', async () => {
  const one = show(); const two = show()
  await one.vm.nudge(0.01)
  await two.vm.nudge(0.01)
  expect(socket.printerGcodeScript).toHaveBeenCalledTimes(1)
  one.wrapper.destroy(); two.wrapper.destroy()
})

it('refuses a reused job id with different history identity', async () => {
  database = { firstLayerNudges: { p: { 'run-1': { baseline: 0, start_time: 99, filename: 'part.gcode' } } } }
  const device = show(); await device.vm.nudge(0.01)
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  device.wrapper.destroy()
})

it.each(['layer', 'role', 'pause'])('rechecks %s changed during the database await', async (change) => {
  const device = show()
  http.serverDatabaseItemGet.mockImplementation(async () => {
    if (change === 'layer') device.store.state.printer.printer.print_stats.info.current_layer = 4
    if (change === 'role') cloudState.printers[0].role = 'viewer'
    if (change === 'pause') Vue.set(device.store.state.printer.printer, 'pause_resume', { is_paused: true })
    return { data: { result: { value: undefined } } }
  })
  await device.vm.nudge(0.01)
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  device.wrapper.destroy()
})

it('refuses when context changes while waiting for the lock', async () => {
  const device = show()
  Object.defineProperty(navigator, 'locks', { configurable: true, value: { request: async (_k: string, cb: () => void) => { device.store.state.printer.printer.print_stats.filename = 'other.gcode'; return cb() } } })
  await device.vm.nudge(0.01)
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  device.wrapper.destroy()
})

it('refuses when the shared lock is unavailable', async () => {
  const device = show()
  Object.defineProperty(navigator, 'locks', { configurable: true, value: { request: async () => { throw new Error('no lock') } } })
  await device.vm.nudge(0.01)
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  expect(device.vm.refusal).toContain('could not be locked')
  device.wrapper.destroy()
})

it('uses an externally changed printer offset and displays printer-derived total and room', async () => {
  const device = show(); await nudgeAndReport(device, 0.01)
  device.store.state.printer.printer.gcode_move.homing_origin.splice(2, 1, 0.09)
  await nudgeAndReport(device, 0.01); await Vue.nextTick()
  expect(socket.printerGcodeScript).toHaveBeenCalledTimes(2)
  expect(device.wrapper.text()).toContain('+0.10 mm from the start of this print')
  expect(device.wrapper.text()).toContain('0.00 mm remaining')
  await device.vm.nudge(0.01)
  expect(socket.printerGcodeScript).toHaveBeenCalledTimes(2)
  device.wrapper.destroy()
})

it.each([
  ['unknown offset', (device: ReturnType<typeof show>) => { device.store.state.printer.printer.gcode_move.homing_origin = [] }],
  ['unknown baseline', () => { database = { firstLayerNudges: { p: { 'run-1': 'bad' } } } }],
  ['unavailable database', () => http.serverDatabaseItemGet.mockRejectedValue(new Error('offline'))],
  ['disagreeing read-back', () => http.serverDatabaseItemPost.mockImplementation(async () => atPath('firstLayerNudges.p.run-1', 9))]
])('refuses an %s with nothing sent', async (_name, arrange) => {
  const device = show(); arrange(device); await device.vm.nudge(0.01)
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  expect(device.vm.refusal).toContain('No adjustment sent')
  device.wrapper.destroy()
})

it('keeps layer, printer, control, connection, homing and pending-adjust refusals', async () => {
  const { store, wrapper, vm } = show()
  for (const layer of [0, 4, NaN]) { store.state.printer.printer.print_stats.info.current_layer = layer; await vm.nudge(0.01) }
  store.state.printer.printer.print_stats.info.current_layer = 1
  for (const state of ['paused', 'busy', 'ready']) { store.getters['printer/getPrinterState'] = state; await vm.nudge(0.01) }
  store.getters['printer/getPrinterState'] = 'printing'
  Vue.set(store.state.printer.printer, 'pause_resume', { is_paused: true }); await vm.nudge(0.01)
  store.state.printer.printer.pause_resume.is_paused = false
  store.getters['socket/getConnectionState'] = false; await vm.nudge(0.01); store.getters['socket/getConnectionState'] = true
  cloudState.printers = [{ id: 'p', role: 'viewer', model: 'M1' }] as any; await vm.nudge(0.01)
  cloudState.printers = [{ id: 'p', role: 'operator', model: 'other' }] as any; await vm.nudge(0.01)
  cloudState.printers = [{ id: 'p', role: 'operator', model: 'M1' }] as any
  store.state.printer.printer.toolhead.homed_axes = 'xy'; await vm.nudge(0.01)
  store.state.printer.printer.toolhead.homed_axes = 'xyz'; store.getters['wait/hasWait'] = () => true; await vm.nudge(0.01)
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  wrapper.destroy()
})
