import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import FirstLayerNudges from '../FirstLayerNudges.vue'
import { panelStore } from '@/components/control/__tests__/panel-fixture'
import { cloudState } from '@/services/muon-cloud/state'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'
const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
afterEach(() => { socket.printerGcodeScript.mockClear(); localStorage.clear(); cloudState.printers = []; cloudState.activePrinterId = null; printerTransportBinding.remote = false })
function show () {
  const store = panelStore()
  store.state.config.apiUrl = 'https://muon-cloud.invalid'
  Vue.set(store.state, 'history', { jobs: [{ job_id: 'run-1', filename: 'part.gcode', status: 'in_progress', end_time: null }] })
  Vue.set(store.state.printer.printer, 'print_stats', { filename: 'part.gcode', info: { current_layer: 1 } })
  store.getters['printer/getPrinterState'] = 'printing'
  store.getters['printer/getAvailableCommands'] = { SET_GCODE_OFFSET: {} }
  cloudState.printers = [{ id: 'p', role: 'operator', model: 'M1' }] as any
  cloudState.activePrinterId = 'p'; printerTransportBinding.remote = true
  const wrapper = mount(FirstLayerNudges, { mocks: { $store: store, $waits: { onZAdjust: 'adjust' } } })
  return { store, wrapper, vm: wrapper.vm as any }
}
it('sends the shared signed command once per nudge, shows the running total and refuses beyond cumulative cap', async () => {
  const { wrapper, vm } = show()
  for (let i = 0; i < 10; i++) vm.nudge(-0.01)
  await Vue.nextTick()
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(Array(10).fill('SET_GCODE_OFFSET Z_ADJUST=-0.01 MOVE=1'))
  expect(wrapper.text()).toContain('-0.10 mm')
  vm.nudge(0.01); vm.nudge(-0.01)
  expect(socket.printerGcodeScript).toHaveBeenCalledTimes(10)
  wrapper.destroy()
  const again = show(); again.vm.nudge(-0.01)
  expect(socket.printerGcodeScript).toHaveBeenCalledTimes(10)
  again.wrapper.destroy()
})
it('rechecks real layers, M1 identity, printing, homing, role, connection and captured context', async () => {
  const { store, wrapper, vm } = show()
  for (const layer of [0, 4, NaN]) { store.state.printer.printer.print_stats.info.current_layer = layer; vm.nudge(0.01) }
  for (const state of ['paused', 'busy', 'ready']) { store.getters['printer/getPrinterState'] = state; vm.nudge(0.01) }
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  store.getters['printer/getPrinterState'] = 'printing'
  store.state.printer.printer.print_stats.info.current_layer = 3
  vm.nudge(0.01)
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['SET_GCODE_OFFSET Z_ADJUST=+0.01 MOVE=1'])
  Vue.set(store.state.printer.printer, 'pause_resume', { is_paused: true }); vm.nudge(0.01)
  store.state.printer.printer.pause_resume.is_paused = false
  store.getters['socket/getConnectionState'] = false; vm.nudge(0.01)
  store.getters['socket/getConnectionState'] = true
  cloudState.printers = [{ id: 'p', role: 'viewer', model: 'M1' }] as any; vm.nudge(0.01)
  cloudState.printers = [{ id: 'p', role: 'operator', model: 'other' }] as any; vm.nudge(0.01)
  cloudState.printers = [{ id: 'p', role: 'operator', model: 'M1' }] as any
  store.state.printer.printer.toolhead.homed_axes = 'xy'; vm.nudge(0.01)
  store.state.printer.printer.toolhead.homed_axes = 'xyz'
  store.state.config.apiUrl = 'http://other.local'; vm.nudge(0.01)
  expect(socket.printerGcodeScript).toHaveBeenCalledTimes(1)
  wrapper.destroy()
})
