import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ManualProbeRecovery from '../ManualProbeRecovery.vue'
import ManualProbeDialog from '../ManualProbeDialog.vue'
import { cloudState } from '@/services/muon-cloud/state'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
afterEach(() => { socket.printerGcodeScript.mockClear(); cloudState.account = null })

it.each(['printer', 'account'])('reopens an active paper test after returning to its %s context', async kind => {
  const state = Vue.observable<any>({ config: { apiUrl: 'http://a.local', uiSettings: { general: { zAdjustDistances: [0.01] } } }, printer: { printer: { manual_probe: { is_active: true } } } })
  const getters = Vue.observable<any>({ 'auth/getAuthenticated': true, 'socket/getConnectionState': true, 'socket/getApiConnected': true, 'printer/getKlippyConnected': true, 'printer/getKlippyReady': true, 'printer/getPrinterState': 'ready', 'printer/getIsManualProbeActive': true, 'wait/hasWait': () => false })
  const wrapper = mount({ components: { ManualProbeRecovery }, data: () => ({ open: false }), template: '<manual-probe-recovery v-model="open" />' }, { mocks: { $store: { state, getters, dispatch: vi.fn() }, $route: { params: { printer: 'a' } }, $waits: { onManualProbe: 'probe' } }, stubs: { 'v-dialog': { template: '<div><slot /></div>' }, 'frame-icon': true, 'v-progress-circular': true } })
  await Vue.nextTick(); await Vue.nextTick()
  expect(wrapper.find('[data-tid="manual-probe-accept"]').exists()).toBe(true)
  const oldDialog = wrapper.findComponent(ManualProbeDialog).vm as any
  if (kind === 'printer') state.config.apiUrl = 'http://b.local'
  else cloudState.account = { id: 'other', name: 'Other', email: 'other@example.test', created_at: 1 }
  await Vue.nextTick(); await Vue.nextTick()
  expect(wrapper.find('[data-tid="manual-probe-accept"]').exists()).toBe(false)
  oldDialog.sendAccept()
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  getters['printer/getIsManualProbeActive'] = false
  state.printer.printer.manual_probe.is_active = false
  await Vue.nextTick()
  if (kind === 'printer') state.config.apiUrl = 'http://a.local'
  else cloudState.account = null
  await Vue.nextTick()
  getters['printer/getIsManualProbeActive'] = true
  state.printer.printer.manual_probe.is_active = true
  await Vue.nextTick(); await Vue.nextTick(); await Vue.nextTick()
  expect(wrapper.find('[data-tid="manual-probe-abort"]').exists()).toBe(true)
  await wrapper.find('[data-tid="manual-probe-abort"]').trigger('click')
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['ABORT'])
  wrapper.destroy()
})

it('waits for fresh manual probe status after returning from another active printer', async () => {
  const state = Vue.observable<any>({ config: { apiUrl: 'http://a.local', uiSettings: { general: { zAdjustDistances: [0.01] } } }, printer: { printer: { manual_probe: { is_active: true, z_position: 2 } } } })
  const getters = Vue.observable<any>({ 'auth/getAuthenticated': true, 'socket/getConnectionState': true, 'socket/getApiConnected': true, 'printer/getKlippyConnected': true, 'printer/getKlippyReady': true, 'printer/getPrinterState': 'ready', 'printer/getIsManualProbeActive': true, 'wait/hasWait': () => false })
  const wrapper = mount({ components: { ManualProbeRecovery }, template: '<manual-probe-recovery />' }, { mocks: { $store: { state, getters, dispatch: vi.fn() }, $route: { params: { printer: 'a' } }, $waits: { onManualProbe: 'probe' } }, stubs: { 'v-dialog': { template: '<div><slot /></div>' }, 'frame-icon': true, 'v-progress-circular': true } })
  await Vue.nextTick(); await Vue.nextTick()
  expect(wrapper.find('[data-tid="manual-probe-accept"]').exists()).toBe(true)

  state.config.apiUrl = 'http://b.local'
  await Vue.nextTick(); await Vue.nextTick()
  state.printer.printer.manual_probe.z_position = 3 // B's fresh active status.
  await Vue.nextTick(); await Vue.nextTick()
  expect(wrapper.find('[data-tid="manual-probe-accept"]').exists()).toBe(true)

  state.config.apiUrl = 'http://a.local'
  await Vue.nextTick(); await Vue.nextTick()
  expect(wrapper.find('[data-tid="manual-probe-accept"]').exists()).toBe(false)
  state.printer.printer.manual_probe.z_position = 2 // A's fresh active status.
  await Vue.nextTick(); await Vue.nextTick()
  expect(wrapper.find('[data-tid="manual-probe-accept"]').exists()).toBe(true)
  wrapper.destroy()
})
