import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ManualProbeDialog from '../ManualProbeDialog.vue'
import { proMode } from '@/services/pro-mode'
import { cloudState } from '@/services/muon-cloud/state'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))

function show (role?: 'operator' | 'viewer') {
  if (role) {
    printerTransportBinding.remote = true
    cloudState.activePrinterId = 'managed'
    cloudState.printers = [{ id: 'managed', role }] as any
  }
  const state = Vue.observable<any>({
    config: { apiUrl: role ? 'https://muon-cloud.invalid' : 'http://mock.local', uiSettings: { general: { zAdjustDistances: [0.05, 0.01] } } },
    printer: { printer: { manual_probe: { is_active: true, z_position: 2, z_position_lower: 1.9, z_position_upper: 2.1 } } }
  })
  const getters = Vue.observable<Record<string, any>>({
    'auth/getAuthenticated': true,
    'socket/getConnectionState': true,
    'socket/getApiConnected': true,
    'printer/getKlippyConnected': true,
    'printer/getKlippyReady': true,
    'printer/getPrinterState': 'ready',
    'printer/getIsManualProbeActive': true,
    'wait/hasWait': () => false
  })
  const route = Vue.observable({ params: { printer: 'mock' } })
  const wrapper = mount(ManualProbeDialog, {
    propsData: { value: true },
    mocks: { $store: { state, getters, dispatch: vi.fn() }, $route: route, $waits: { onManualProbe: 'probe' } },
    stubs: { 'v-dialog': { template: '<div><slot /></div>' }, 'frame-icon': true, 'v-progress-circular': true }
  })
  return { wrapper, state, getters, route, vm: wrapper.vm as any }
}
afterEach(() => { socket.printerGcodeScript.mockClear(); proMode.on = false; cloudState.account = null; cloudState.activePrinterId = null; cloudState.printers = []; printerTransportBinding.remote = false })

it('opens Finer steps with the reported tried range without a mode', async () => {
  proMode.on = false
  const { wrapper } = show()
  expect(wrapper.text()).toContain('tried 1.900 to 2.100')
  const fold = wrapper.find('[data-tid="manual-probe-finer"]')
  expect(fold.exists()).toBe(true)
  expect(fold.attributes('aria-expanded')).toBe('false')
  await fold.trigger('click')
  expect(fold.attributes('aria-expanded')).toBe('true')
  for (const step of ['--', '-', '+', '++']) await wrapper.find(`[data-step="${step}"]`).trigger('click')
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['TESTZ Z=--', 'TESTZ Z=-', 'TESTZ Z=+', 'TESTZ Z=++'])
  wrapper.destroy()
})

it.each([
  ['near neighbours', 1.9, 2.1, ['To 1.900 mm (closer)', 'To 1.950 mm (closer)', 'To 2.050 mm (away)', 'To 2.100 mm (away)']],
  ['neighbours beyond the cap', 1, 3, ['To 1.800 mm (closer)', 'To 1.800 mm (closer)', 'To 2.200 mm (away)', 'To 2.200 mm (away)']],
  ['no neighbours', null, null, ['To 1.800 mm (closer)', 'To 1.800 mm (closer)', 'To 2.200 mm (away)', 'To 2.200 mm (away)']]
] as const)('describes all bracket targets with %s', async (_, lower, upper, labels) => {
  const { wrapper, state } = show()
  state.printer.printer.manual_probe.z_position_lower = lower
  state.printer.printer.manual_probe.z_position_upper = upper
  await wrapper.find('[data-tid="manual-probe-finer"]').trigger('click')
  expect(['--', '-', '+', '++'].map(step => wrapper.find(`[data-step="${step}"]`).text())).toEqual(labels)
  wrapper.destroy()
})

it('keeps numeric TESTZ semantics, accepts once and aborts on close', async () => {
  const { wrapper } = show()
  await wrapper.find('[aria-label="0.05 mm closer to the plate"]').trigger('click')
  await wrapper.find('[aria-label="0.1 mm away from the plate"]').trigger('click')
  await wrapper.find('[data-tid="manual-probe-accept"]').trigger('click')
  await wrapper.find('[data-tid="m3-dlg-close"]').trigger('click')
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['TESTZ Z=-0.05', 'TESTZ Z=+0.1', 'ACCEPT', 'ABORT'])
  expect(wrapper.emitted('input')?.at(-1)).toEqual([false])
  wrapper.destroy()
})

it.each(['socket/getConnectionState', 'socket/getApiConnected', 'auth/getAuthenticated', 'printer/getKlippyReady', 'printer/getKlippyConnected', 'printer/getIsManualProbeActive'])('refuses direct handlers after %s is lost', key => {
  const { wrapper, getters, vm } = show()
  getters[key] = false
  vm.sendTestZ('-0.1'); vm.sendAccept(); vm.sendAbort()
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  wrapper.destroy()
})

it.each(['printing', 'paused', 'loading'])('refuses adjustments and accept while %s', state => {
  const { wrapper, getters, vm } = show()
  getters['printer/getPrinterState'] = state
  vm.sendTestZ('-0.1'); vm.sendAccept()
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  wrapper.destroy()
})

it.each(['route', 'api', 'account'])('never operates the next target after a %s change', target => {
  const { wrapper, state, route, vm } = show()
  if (target === 'api') state.config.apiUrl = 'http://other.local'
  if (target === 'route') route.params.printer = 'other'
  if (target === 'account') cloudState.account = { id: 'other' } as any
  vm.sendTestZ('-0.1'); vm.sendAccept(); vm.sendAbort()
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  wrapper.destroy()
})

it('rejects injected, unknown and nonfinite steps and filters invalid configured distances', () => {
  const { wrapper, state, vm } = show()
  state.config.uiSettings.general.zAdjustDistances = [0, -1, NaN, Infinity, 0.05]
  for (const step of ['NaN', '-9', '+Infinity', '0.1\nG28', '0', 'garbage']) vm.sendTestZ(step)
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  expect(vm.offsets).toEqual([1, 0.1, 0.05])
  wrapper.destroy()
})

it('disables duplicate operations while Klipper is processing and keeps stop available during a print', () => {
  const { wrapper, getters, vm } = show()
  getters['wait/hasWait'] = () => true
  vm.sendTestZ('-0.1'); vm.sendAccept(); vm.sendAbort()
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  getters['wait/hasWait'] = () => false
  getters['printer/getPrinterState'] = 'printing'
  vm.sendAbort()
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['ABORT'])
  wrapper.destroy()
})

it('allows a cloud operator and refuses after the same session becomes a viewer', () => {
  const { wrapper, vm } = show('operator')
  vm.sendTestZ('-0.1')
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['TESTZ Z=-0.1'])
  socket.printerGcodeScript.mockClear()
  cloudState.printers = [{ id: 'managed', role: 'viewer' }] as any
  vm.sendTestZ('-0.1'); vm.sendAccept(); vm.sendAbort()
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  wrapper.destroy()
})

it('lets a disconnected person close the dialog locally without sending an abort', async () => {
  const { wrapper, getters } = show()
  getters['socket/getConnectionState'] = false
  await Vue.nextTick()
  await wrapper.find('[data-tid="m3-dlg-close"]').trigger('click')
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  expect(wrapper.emitted('input')?.at(-1)).toEqual([false])
  wrapper.destroy()
})
