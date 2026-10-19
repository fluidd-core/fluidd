import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ControlHeat from '../ControlHeat.vue'
import { panelStore, panelStubs, waits } from './panel-fixture'
import { proMode } from '@/services/pro-mode'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
afterEach(() => { socket.printerGcodeScript.mockClear(); proMode.on = false })

it.each([false, true])('offers exact heat targets beside nudges on phone=%s with mode off', async phone => {
  proMode.on = false
  const store = panelStore()
  store.getters['printer/getAllFans'] = [{ key: 'temperature_fan drivers', name: 'drivers', prettyName: 'Motor drivers', type: 'temperature_fan', temperature: 41 }]
  const wrapper = mount(ControlHeat, { propsData: { phone }, mocks: { $store: store, $waits: waits }, stubs: panelStubs })
  const input = wrapper.find('input[aria-label="Nozzle target"]')
  expect(input.exists()).toBe(true)
  await input.setValue('230'); await input.trigger('keydown.enter')
  await wrapper.find('[aria-label="Bed hotter"]').trigger('click')
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['SET_HEATER_TEMPERATURE HEATER=extruder TARGET=230', 'SET_HEATER_TEMPERATURE HEATER=heater_bed TARGET=65'])
  expect(wrapper.text()).toContain('power 41%')
  await wrapper.find('#heat\\.other-trigger').trigger('click')
  expect(wrapper.text()).toContain('CPU'); expect(wrapper.text()).toContain('52.3°'); expect(wrapper.text()).toContain('Motor drivers')
  wrapper.destroy()
})

it('refuses an out-of-range target and a target after the connection is lost', async () => {
  const store = panelStore()
  const wrapper = mount(ControlHeat, { mocks: { $store: store, $waits: waits }, stubs: panelStubs })
  const input = wrapper.find('input[aria-label="Nozzle target"]')
  expect(input.exists()).toBe(true)
  await input.setValue('266'); await input.trigger('keydown.enter')
  expect(input.attributes('aria-invalid')).toBe('true')
  await input.setValue('220'); store.getters['socket/getConnectionState'] = false; await input.trigger('keydown.enter')
  expect(socket.printerGcodeScript).not.toHaveBeenCalled(); wrapper.destroy()
})

it('discards an edited target when the selected printer changes', async () => {
  const store = panelStore()
  const wrapper = mount(ControlHeat, { mocks: { $store: store, $waits: waits }, stubs: panelStubs })
  await wrapper.find('input[aria-label="Nozzle target"]').setValue('230')
  store.state.config.apiUrl = 'http://other.local'; await wrapper.vm.$nextTick()
  const field = wrapper.find('input[aria-label="Nozzle target"]')
  await field.trigger('keydown.enter')
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  expect((field.element as HTMLInputElement).value).toBe('215')
  wrapper.destroy()
})
