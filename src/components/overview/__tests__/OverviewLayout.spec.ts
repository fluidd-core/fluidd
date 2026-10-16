import Vue from 'vue'
import VueRouter from 'vue-router'
import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import Overview from '@/views/Overview.vue'
import { proMode } from '@/services/pro-mode'
import OverviewCards from '../OverviewCards.vue'
import { ControlPreferenceStore } from '@/services/control/preferences'
import { cloudState } from '@/services/muon-cloud/state'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'

const socket = vi.hoisted(() => ({ printerPrintPause: vi.fn(), printerPrintCancel: vi.fn(), printerPrintStart: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
afterEach(() => { proMode.on = false; vi.clearAllMocks(); cloudState.account = null; cloudState.activePrinterId = null; cloudState.printers = []; printerTransportBinding.remote = false; localStorage.clear() })
it('keeps print actions fixed with either old mode value and rechecks the target after Stop confirmation', async () => {
  let confirm!: (value: boolean) => void
  const state = Vue.observable<any>({ config: { apiUrl: 'http://mock.local', uiSettings: { general: {} } }, printer: { printer: { print_stats: { filename: 'part.gcode' } } } })
  const getters = Vue.observable<any>({ 'auth/getAuthenticated': true, 'socket/getConnectionState': true, 'socket/getApiConnected': true, 'printer/getKlippyReady': true, 'printer/getKlippyConnected': true, 'printer/getPrinterState': 'printing', 'printer/getHeaters': [], 'printer/getSensors': [], 'printer/getAvailableCommands': {}, 'jobQueue/getQueuedJobs': [] })
  const wrapper = mount(Overview, { computed: { isMobileViewport: () => false }, mocks: { $store: { state, getters, dispatch: vi.fn() }, $confirm: () => new Promise<boolean>(resolve => { confirm = resolve }) }, stubs: { 'overview-stage': true, 'overview-this-print': true, 'overview-tiles': true, 'overview-temps': true, 'overview-live-tune': true, 'overview-console': true, 'overview-quick-actions': true, 'control-macros': true, 'router-link': { template: '<a><slot /></a>' } } })
  expect(wrapper.find('[data-tid="overview-pause"]').exists()).toBe(true)
  await wrapper.find('[data-tid="overview-pause"]').trigger('click')
  expect(socket.printerPrintPause).toHaveBeenCalledTimes(1)
  proMode.on = true
  await Vue.nextTick()
  expect(wrapper.find('[data-tid="overview-pause"]').exists()).toBe(true)
  await wrapper.find('[data-tid="overview-stop"]').trigger('click')
  state.config.apiUrl = 'http://other.local'
  confirm(true)
  await Vue.nextTick(); await Vue.nextTick()
  expect(socket.printerPrintCancel).not.toHaveBeenCalled()
  wrapper.destroy()
})

it('refuses Print again when the context changes during confirmation', async () => {
  let approve!: (value: boolean) => void
  const state = Vue.observable<any>({ config: { apiUrl: 'http://mock.local', uiSettings: { general: {} } }, printer: { printer: {} } })
  const getters = Vue.observable<any>({ 'config/getDisplayName': 'Mock', 'auth/getAuthenticated': true, 'socket/getConnectionState': true, 'socket/getApiConnected': true, 'printer/getKlippyReady': true, 'printer/getKlippyConnected': true, 'printer/getPrinterState': 'ready', 'printer/getHeaters': [], 'printer/getSensors': [], 'jobQueue/getQueuedJobs': [] })
  const wrapper = mount(Overview, { router: new VueRouter({ mode: 'abstract' }), computed: { isMobileViewport: () => false }, mocks: { $store: { state, getters, dispatch: vi.fn() }, $confirm: () => new Promise<boolean>(resolve => { approve = resolve }) }, stubs: { 'overview-stage': true, 'overview-print-something': true, 'overview-tiles': true, 'overview-quick-actions': true } })
  const pending = (wrapper.vm as any).printAgain('part.gcode')
  state.config.apiUrl = 'http://other.local'
  approve(true)
  await pending
  expect(socket.printerPrintStart).not.toHaveBeenCalled()
  wrapper.destroy()
})

it('refuses a stale editor input instead of saving the old arrangement to the newly selected printer', async () => {
  cloudState.account = { id: 'alice', name: 'Alice', email: 'alice@example.test', created_at: 1 }
  cloudState.printers = ['a', 'b'].map(id => ({ id, name: id, model: 'M1', version: '1', linked_at: 1, last_seen: 1, online: true, online_since: 1, role: 'operator' as const }))
  cloudState.activePrinterId = 'a'; printerTransportBinding.remote = true
  localStorage.setItem('muon.cloud.token', 'fixture-session')
  const writes: string[] = []
  const preferences = new ControlPreferenceStore({ read: async () => ({ version: 2, folds: {}, overview: { cards: null } }), patch: async () => ({ version: 1, folds: {} }), patchLayout: async (context, cards) => { writes.push(context.printerId!); return { version: 2, folds: {}, overview: { cards } } } }, localStorage)
  const state = Vue.observable<any>({ config: { apiUrl: 'https://muon-cloud.invalid', uiSettings: { general: {} } }, printer: { printer: {} } })
  const getters = Vue.observable<any>({ 'printer/getPrinterState': 'printing', 'printer/getHeaters': [], 'printer/getSensors': [], 'jobQueue/getQueuedJobs': [] })
  const wrapper = mount(Overview, { propsData: { preferenceStore: preferences }, computed: { isMobileViewport: () => false }, mocks: { $store: { state, getters, dispatch: vi.fn() } }, stubs: { 'overview-stage': true, 'overview-this-print': true, 'overview-tiles': true, 'overview-console': true } })
  try {
    await wrapper.find('[aria-expanded]').trigger('click')
    const editor = wrapper.findComponent(OverviewCards)
    cloudState.activePrinterId = 'b'
    editor.vm.$emit('input', ['console'])
    await Vue.nextTick(); await Vue.nextTick(); await Vue.nextTick()
    expect(writes).toEqual([])
  } finally { wrapper.destroy() }
})

it('keeps cards available for an empty spool, a brief Klipper outage, and managed Console', async () => {
  cloudState.account = { id: 'alice', name: 'Alice', email: 'alice@example.test', created_at: 1 }
  cloudState.printers = [{ id: 'a', name: 'a', model: 'M1', version: '1', linked_at: 1, last_seen: 1, online: true, online_since: 1, role: 'operator' }]
  cloudState.activePrinterId = 'a'; printerTransportBinding.remote = true
  const state = Vue.observable<any>({
    config: { apiUrl: 'https://muon-cloud.invalid', uiSettings: { general: {}, temperaturePresets: [{ id: 'pla', name: 'PLA', values: {} }] } },
    printer: { printer: { save_variables: { variables: {} } } }
  })
  const getters = Vue.observable<any>({ 'auth/getAuthenticated': true, 'socket/getConnectionState': true, 'socket/getApiConnected': true, 'printer/getKlippyReady': false, 'printer/getKlippyConnected': false, 'printer/getPrinterState': 'loading', 'printer/getHeaters': [], 'printer/getSensors': [], 'printer/getAvailableCommands': {}, 'config/getTempPresets': [], 'jobQueue/getQueuedJobs': [] })
  const wrapper = mount(Overview, { computed: { isMobileViewport: () => false }, mocks: { $store: { state, getters, dispatch: vi.fn() } }, stubs: { 'overview-stage': true, 'overview-print-something': true, 'overview-tiles': true, 'overview-quick-actions': true } })
  const unavailable = (wrapper.vm as any).unavailable
  expect(unavailable.spool).toBeUndefined()
  expect(unavailable['quick-actions']).toBeUndefined()
  expect(unavailable['live-tune']).toBeUndefined()
  expect(unavailable.console).toBeUndefined()
  wrapper.destroy()
})

it('keeps the stage, current print, Pause and Stop outside a hostile empty card layout', async () => {
  cloudState.account = { id: 'alice', name: 'Alice', email: 'alice@example.test', created_at: 1 }
  cloudState.printers = [{ id: 'a', name: 'a', model: 'M1', version: '1', linked_at: 1, last_seen: 1, online: true, online_since: 1, role: 'operator' }]
  cloudState.activePrinterId = 'a'; printerTransportBinding.remote = true
  localStorage.setItem('muon.cloud.token', 'fixture-session')
  const preferences = new ControlPreferenceStore({ read: async () => ({ version: 2, folds: {}, overview: { cards: [] } }), patch: async () => ({ version: 1, folds: {} }) }, localStorage)
  const state = Vue.observable<any>({ config: { apiUrl: 'https://muon-cloud.invalid', uiSettings: { general: {} } }, printer: { printer: { print_stats: { filename: 'part.gcode' } } } })
  const getters = Vue.observable<any>({ 'socket/getConnectionState': true, 'socket/getApiConnected': true, 'auth/getAuthenticated': true, 'printer/getKlippyReady': true, 'printer/getKlippyConnected': true, 'printer/getPrinterState': 'printing', 'printer/getHeaters': [], 'printer/getSensors': [], 'printer/getAvailableCommands': {}, 'jobQueue/getQueuedJobs': [] })
  const wrapper = mount(Overview, { propsData: { preferenceStore: preferences }, computed: { isMobileViewport: () => false }, mocks: { $store: { state, getters, dispatch: vi.fn() } }, stubs: { 'overview-stage': { template: '<div data-fixed="stage" />' }, 'overview-this-print': { template: '<div data-fixed="print" />' }, 'overview-tiles': true } })
  await Vue.nextTick(); await Vue.nextTick()
  expect(wrapper.find('[data-fixed="stage"]').exists()).toBe(true)
  expect(wrapper.find('[data-fixed="print"]').exists()).toBe(true)
  expect(wrapper.find('[data-tid="overview-pause"]').exists()).toBe(true)
  expect(wrapper.find('[data-tid="overview-stop"]').exists()).toBe(true)
  expect(wrapper.findAll('.overview__cards [data-card]')).toHaveLength(0)
  wrapper.destroy()
})
