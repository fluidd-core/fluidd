import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import MaintenanceMesh from '../MaintenanceMesh.vue'
import { panelStore, panelStubs } from '@/components/control/__tests__/panel-fixture'
import { cloudState } from '@/services/muon-cloud/state'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'
import { sectionOf, visiblePages } from '@/router/printerSections'

vi.mock('@/api/socketActions', () => ({ SocketActions: { printerGcodeScript: vi.fn() } }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'mock' }))
vi.mock('@/services/account/control-preferences', async () => {
  const { ControlPreferenceStore } = await import('@/services/control/preferences')
  return { controlPreferenceStore: new ControlPreferenceStore({ read: async () => ({ version: 1, folds: {} }), patch: async (_, folds) => ({ version: 1, folds }) }, localStorage) }
})
const settle = async () => { for (let i = 0; i < 12; i++) { await Promise.resolve(); await Vue.nextTick() } }
function show (managed = false) {
  const store = panelStore()
  store.state.config.apiUrl = managed ? 'https://muon-cloud.invalid' : 'http://mock.local'
  printerTransportBinding.remote = managed
  cloudState.activePrinterId = managed ? 'stable-one' : null
  Vue.set(store.state.printer.printer, 'bed_mesh', { probed_matrix: [[-0.12, 0.04], [0.02, 0.15]], profile_name: 'default' })
  for (const [key, value] of Object.entries({ 'mesh/getSupportsBedMesh': true, 'printer/getHomedAxes': (): boolean => true, 'server/componentSupport': (): boolean => false })) Vue.set(store.getters, key, value)
  const wrapper = mount(MaintenanceMesh, { mocks: { $store: store, $waits: {}, $route: { params: { printer: 'mock' } } }, stubs: { ...panelStubs, 'router-link': { props: ['to'], template: '<a :href="to"><slot /></a>' } } })
  return { wrapper, store }
}
afterEach(() => { localStorage.clear(); cloudState.account = null; cloudState.activePrinterId = null; printerTransportBinding.remote = false })

it('offers Bed only on a capable printer', () => {
  const section = sectionOf('/maintenance')!
  const context = { slicer: false, camera: null, history: false, timelapse: false, diagnostics: false, foreign: false, bedMesh: true }
  expect(visiblePages(section, context).map(p => p.label)).toEqual(['Health', 'Bed'])
  expect(visiblePages(section, { ...context, bedMesh: false }).map(p => p.label)).toEqual(['Health'])
})

it('switches Colours/Numbers with pressed states, keeps measured values accessible and links scoped Bed', async () => {
  const { wrapper } = show()
  const numbers = wrapper.find('[data-tid="mesh-numbers"]')
  expect(numbers.exists()).toBe(true)
  expect(numbers.attributes('aria-pressed')).toBe('false')
  expect(wrapper.findAll('.mmesh__cell').at(0).text()).toBe('')
  await numbers.trigger('click'); await settle()
  expect(numbers.attributes('aria-pressed')).toBe('true')
  expect(wrapper.findAll('.mmesh__cell').at(0).text()).toBe('-0.12')
  expect(wrapper.text()).toContain('this visit')
  expect(wrapper.find('a').attributes('href')).toBe('/mock/tune')
  expect(wrapper.find('[role="table"]').attributes('aria-label')).toContain('Bed mesh')
  wrapper.destroy()
})

it('remembers Numbers by stable printer and clears the previous account and printer view', async () => {
  const first = show(true)
  await settle()
  await first.wrapper.find('[data-tid="mesh-numbers"]').trigger('click'); await settle()
  first.wrapper.destroy()
  const next = show(true)
  await settle()
  expect(next.wrapper.find('[data-tid="mesh-numbers"]').attributes('aria-pressed')).toBe('true')
  cloudState.account = { id: 'alice', email: 'alice@example.test', name: 'Alice', created_at: 1 }
  localStorage.setItem('muon.cloud.token', 'alice-token')
  await settle()
  expect(next.wrapper.find('[data-tid="mesh-numbers"]').attributes('aria-pressed')).toBe('false')
  cloudState.activePrinterId = 'stable-two'; await settle()
  expect(next.wrapper.find('[data-tid="mesh-numbers"]').attributes('aria-pressed')).toBe('false')
  next.wrapper.destroy()
})

it('shows incomplete or invalid measurement cells as unmeasured without NaN colours', async () => {
  const { wrapper, store } = show()
  store.state.printer.printer.bed_mesh.probed_matrix = [[NaN, Infinity], [null, 0.02]]
  await Vue.nextTick()
  expect(wrapper.findAll('[role="cell"][aria-label="Not measured"]').length).toBe(3)
  expect(wrapper.html()).not.toContain('NaN')
  wrapper.destroy()
})
