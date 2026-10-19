import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import OverviewLiveTune from '../OverviewLiveTune.vue'
import { panelStore } from '@/components/control/__tests__/panel-fixture'
import { cloudState } from '@/services/muon-cloud/state'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'
const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
afterEach(() => { socket.printerGcodeScript.mockClear(); cloudState.printers = []; cloudState.activePrinterId = null; printerTransportBinding.remote = false })
it('uses the shared Z path and refuses viewer, unhomed and busy-save invocation', () => {
  const store = panelStore()
  store.state.config.apiUrl = 'https://muon-cloud.invalid'
  store.getters['printer/getAvailableCommands'] = { Z_OFFSET_APPLY_PROBE: {} }
  const printer = { id: 'p', name: 'Mock', model: 'M1', version: '1', linked_at: 1, last_seen: 1, online: true, online_since: 1, role: 'operator' as const }
  cloudState.printers = [printer]; cloudState.activePrinterId = 'p'; printerTransportBinding.remote = true
  const wrapper = mount(OverviewLiveTune, { mocks: { $store: store, $waits: { onZAdjust: 'adjust' } }, stubs: { 'frame-icon': true } })
  try {
    const vm = wrapper.vm as any
    vm.nudgeZ(-0.01)
    expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['SET_GCODE_OFFSET Z_ADJUST=-0.01 MOVE=1'])
    cloudState.printers = [{ ...printer, role: 'viewer' }]
    vm.nudgeZ(0.01); vm.saveZ()
    expect(socket.printerGcodeScript).toHaveBeenCalledTimes(1)
    cloudState.printers = [printer]
    store.state.printer.printer.toolhead.homed_axes = 'xy'; vm.nudgeZ(0.01)
    store.getters['printer/getPrinterState'] = 'printing'; vm.saveZ()
    expect(socket.printerGcodeScript).toHaveBeenCalledTimes(1)
  } finally { wrapper.destroy() }
})
