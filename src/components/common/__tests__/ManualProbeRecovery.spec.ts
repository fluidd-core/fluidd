import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ManualProbeRecovery from '../ManualProbeRecovery.vue'
import ManualProbeDialog from '../ManualProbeDialog.vue'
import { cloudState } from '@/services/muon-cloud/state'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
afterEach(() => { socket.printerGcodeScript.mockClear(); cloudState.account = null })

function setup (automatic = true) {
  const state = Vue.observable<any>({ config: { apiUrl: 'http://a.local', uiSettings: { general: { zAdjustDistances: [0.01] } } }, printer: { printer: { manual_probe: { is_active: true, z_position: 2 } } } })
  const getters = Vue.observable<any>({ 'auth/getAuthenticated': true, 'socket/getConnectionState': true, 'socket/getApiConnected': true, 'printer/getKlippyConnected': true, 'printer/getKlippyReady': true, 'printer/getPrinterState': 'ready', 'printer/getIsManualProbeActive': true, 'wait/hasWait': () => false })
  const subscribers: Array<(mutation: any) => void> = []
  const unsubscribe = vi.fn()
  const store = {
    state,
    getters,
    dispatch: vi.fn(),
    subscribe: vi.fn((subscriber: (mutation: any) => void) => { subscribers.push(subscriber); return unsubscribe })
  }
  const wrapper = mount({
    components: { ManualProbeRecovery },
    data: () => ({ open: false }),
    template: `<manual-probe-recovery v-model="open" :automatic="${automatic}" />`
  }, { mocks: { $store: store, $route: { params: { printer: 'a' } }, $waits: { onManualProbe: 'probe' } }, stubs: { 'v-dialog': { template: '<div><slot /></div>' }, 'frame-icon': true, 'v-progress-circular': true } })
  const notifyProbe = (payload = { is_active: true, z_position: 2 }) => {
    Object.keys(payload).forEach(key => {
      if (state.printer.printer.manual_probe[key] !== (payload as any)[key]) Vue.set(state.printer.printer.manual_probe, key, (payload as any)[key])
    })
    subscribers.forEach(subscriber => subscriber({ type: 'printer/setSocketNotify', payload: { key: 'manual_probe', payload } }))
  }
  return { wrapper, state, getters, notifyProbe, unsubscribe }
}

it('does not remount an open dialog when TESTZ status arrives', async () => {
  const { wrapper, notifyProbe } = setup()
  await Vue.nextTick(); await Vue.nextTick()
  await wrapper.find('[data-tid="manual-probe-finer"]').trigger('click')
  const dialog = wrapper.findComponent(ManualProbeDialog).vm

  notifyProbe({ is_active: true, z_position: 1.9 })
  await Vue.nextTick(); await Vue.nextTick()

  expect(wrapper.findComponent(ManualProbeDialog).vm).toBe(dialog)
  expect(wrapper.find('[data-tid="manual-probe-finer"]').attributes('aria-expanded')).toBe('true')
  wrapper.destroy()
})

it('keeps a manually opened non-automatic dialog open after TESTZ', async () => {
  const { wrapper, notifyProbe } = setup(false)
  await Vue.nextTick()
  ;(wrapper.vm as any).open = true
  await Vue.nextTick()
  const dialog = wrapper.findComponent(ManualProbeDialog).vm

  notifyProbe({ is_active: true, z_position: 1.9 })
  await Vue.nextTick(); await Vue.nextTick()

  expect(wrapper.findComponent(ManualProbeDialog).vm).toBe(dialog)
  wrapper.destroy()
})

it.each(['printer', 'account'])('requires a fresh status commit before recovery after a %s switch', async kind => {
  const { wrapper, state, notifyProbe } = setup()
  await Vue.nextTick(); await Vue.nextTick()
  expect(wrapper.findComponent(ManualProbeDialog).exists()).toBe(true)

  if (kind === 'printer') state.config.apiUrl = 'http://b.local'
  else cloudState.account = { id: 'other', name: 'Other', email: 'other@example.test', created_at: 1 }
  await Vue.nextTick(); await Vue.nextTick()
  expect(wrapper.findComponent(ManualProbeDialog).exists()).toBe(false)
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()

  if (kind === 'printer') state.config.apiUrl = 'http://a.local'
  else cloudState.account = null
  await Vue.nextTick(); await Vue.nextTick()
  expect(wrapper.findComponent(ManualProbeDialog).exists()).toBe(false)
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()

  // The real status is byte-for-byte equal to stale Vuex state. The mutation
  // commit, rather than a reactive value change, proves it is fresh.
  notifyProbe()
  await Vue.nextTick(); await Vue.nextTick()
  expect(wrapper.findComponent(ManualProbeDialog).exists()).toBe(true)
  wrapper.destroy()
})

it('unsubscribes from mutation notifications when destroyed', () => {
  const { wrapper, unsubscribe } = setup()
  wrapper.destroy()
  expect(unsubscribe).toHaveBeenCalledOnce()
})
