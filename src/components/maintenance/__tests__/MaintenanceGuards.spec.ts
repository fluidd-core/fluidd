import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import MaintenanceChecks from '../MaintenanceChecks.vue'
import ProbeCard from '../ProbeCard.vue'
import MeshProfiles from '../MeshProfiles.vue'
import { panelStore, panelStubs, waits } from '@/components/control/__tests__/panel-fixture'
import { cloudState } from '@/services/muon-cloud/state'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'
import { running } from '@/services/maintenance/running'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn(), printerQueryEndstops: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'mock' }))

function show (component: any = MaintenanceChecks) {
  const store = panelStore()
  store.getters['printer/getHomedAxes'] = () => true
  Vue.set(store.state.printer.printer, 'gcode', { commands: { BED_MESH_CALIBRATE: {}, PROBE_CALIBRATE: {}, SHAPER_CALIBRATE: {}, PID_CALIBRATE: {}, PROBE_ACCURACY: {} } })
  Vue.set(store.getters, 'printer/getSaveConfigPending', true)
  Vue.set(store.getters, 'printer/getSaveConfigPendingItems', {})
  store.getters['server/componentSupport'] = () => false
  store.getters['mesh/getBedMeshProfiles'] = [{ name: 'default', range: 0.1, active: false }]
  store.getters['printer/getProbe'] = { name: 'probe', last_query: false }
  store.getters['printer/getPrinterSettings'] = () => ({ z_offset: 0 })
  store.state.printer.printer.bed_mesh = { profile_name: 'default' }
  const route = Vue.observable({ params: { printer: 'mock' } })
  const confirm = vi.fn().mockResolvedValue(true)
  const wrapper = mount(component, {
    mocks: { $store: store, $waits: { ...waits, onSaveConfig: 'save', onQueryProbe: 'query', onProbeAccuracy: 'accuracy' }, $confirm: confirm, $route: route },
    computed: { isMobileViewport: () => false },
    stubs: panelStubs
  })
  return { wrapper, store, route, confirm, vm: wrapper.vm as any }
}
afterEach(() => { vi.clearAllMocks(); cloudState.account = null; cloudState.activePrinterId = null; cloudState.printers = []; printerTransportBinding.remote = false; running.check = null })

it.each(['route', 'account', 'connection', 'authority', 'busy', 'capability'])('refuses calibration after %s changes during confirmation', async change => {
  const { wrapper, vm, store, route, confirm } = show()
  confirm.mockImplementation(async () => {
    if (change === 'route') route.params.printer = 'other'
    if (change === 'account') cloudState.account = { id: 'other' } as any
    if (change === 'connection') store.getters['socket/getConnectionState'] = false
    if (change === 'authority') store.getters['auth/getAuthenticated'] = false
    if (change === 'busy') store.getters['printer/getPrinterState'] = 'busy'
    if (change === 'capability') store.state.printer.printer.gcode.commands = {}
    return true
  })
  await vm.runCheck(vm.checks.find((r: any) => r.id === 'shaper'))
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  expect(running.check).toBeNull()
  wrapper.destroy()
})

it('sends calibration once and records nothing until changed reported results exist', async () => {
  const { wrapper, vm, store } = show()
  await vm.runCheck(vm.checks.find((r: any) => r.id === 'shaper'))
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['SHAPER_CALIBRATE'])
  vm.recordIfDone()
  expect(store.dispatch.mock.calls.filter(c => c[0] === 'config/saveByPath')).toEqual([])
  store.getters['printer/getSaveConfigPendingItems'] = { input_shaper: { shaper_freq_x: '47.4' } }
  vm.recordIfDone()
  expect(store.dispatch).toHaveBeenCalledWith('config/saveByPath', expect.objectContaining({ value: expect.objectContaining({ shaper: expect.any(Number) }) }))
  wrapper.destroy()
})

it.each(['route', 'account', 'busy', 'connection', 'authority'])('refuses SAVE_CONFIG after %s changes in the shared confirmation', async change => {
  const { wrapper, vm, route, store, confirm } = show()
  confirm.mockImplementation(async () => {
    if (change === 'route') route.params.printer = 'other'
    if (change === 'account') cloudState.account = { id: 'other' } as any
    if (change === 'busy') store.getters['printer/getPrinterState'] = 'busy'
    if (change === 'connection') store.getters['socket/getConnectionState'] = false
    if (change === 'authority') store.getters['auth/getAuthenticated'] = false
    return true
  })
  await vm.saveResults()
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  wrapper.destroy()
})

it('confirms Save and restart once with the save wait', async () => {
  const { wrapper, vm, confirm } = show()
  await vm.saveResults()
  expect(confirm).toHaveBeenCalledTimes(1)
  expect(confirm.mock.calls[0][1].buttonTrueText).toContain('Save')
  expect(socket.printerGcodeScript).toHaveBeenCalledWith('SAVE_CONFIG', 'save')
  wrapper.destroy()
})

it('keeps a probe query unknown until its response rather than claiming the cached open value', async () => {
  const { wrapper, vm, store } = show(ProbeCard)
  vm.query(); await Vue.nextTick()
  expect(wrapper.find('.probe__state').exists()).toBe(false)
  expect(socket.printerGcodeScript).toHaveBeenCalledWith('QUERY_PROBE', 'query')
  store.state.console.console.push({ type: 'response', message: '// probe: TRIGGERED', time: Date.now() / 1000 })
  await Vue.nextTick()
  expect(wrapper.find('.probe__state').text()).toBe('Triggered')
  wrapper.destroy()
})

it('ignores old probe responses from the same second and clears a reading on the next query', async () => {
  const { wrapper, vm, store } = show(ProbeCard)
  store.state.console.console.push({ type: 'response', message: '// probe: open', time: Math.floor(Date.now() / 1000) })
  vm.query(); await Vue.nextTick()
  expect(wrapper.find('.probe__state').exists()).toBe(false)
  store.state.console.console.push({ type: 'response', message: '// probe: TRIGGERED', time: Math.floor(Date.now() / 1000) })
  await Vue.nextTick()
  expect(wrapper.find('.probe__state').text()).toBe('Triggered')
  vm.query(); await Vue.nextTick()
  expect(wrapper.find('.probe__state').exists()).toBe(false)
  wrapper.destroy()
})

it.each(['query', 'checkAccuracy'])('refuses probe %s after control is lost', async method => {
  const { wrapper, vm, store } = show(ProbeCard)
  store.getters['auth/getAuthenticated'] = false
  await vm[method]()
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  wrapper.destroy()
})

it('refuses probe motion after a printer switch in confirmation', async () => {
  const { wrapper, vm, route, confirm } = show(ProbeCard)
  confirm.mockImplementation(async () => { route.params.printer = 'other'; return true })
  await vm.checkAccuracy()
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  wrapper.destroy()
})

it.each(['load', 'remove', 'clear', 'saveAs'])('refuses profile %s after control is lost', async method => {
  const { wrapper, vm, store } = show(MeshProfiles)
  store.getters['auth/getAuthenticated'] = false
  await vm[method]('default')
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  wrapper.destroy()
})

it('rejects a profile removal after an account switch in confirmation', async () => {
  const { wrapper, vm, confirm } = show(MeshProfiles)
  confirm.mockImplementation(async () => { cloudState.account = { id: 'other' } as any; return true })
  await vm.remove('default')
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  wrapper.destroy()
})
