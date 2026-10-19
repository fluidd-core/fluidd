import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import OverviewTiles from '../OverviewTiles.vue'
import OverviewThisPrint from '../OverviewThisPrint.vue'
const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
function fixture () {
  const nozzle = { name: 'extruder', prettyName: 'Extruder', target: 215, temperature: 214.8, maxTemp: 300 }
  const bed = { name: 'heater_bed', prettyName: 'Bed', target: 60, temperature: 59.7, maxTemp: 130 }
  const fan = { name: 'fan', prettyName: 'Part fan', type: 'fan', speed: 0.5 }
  const state = Vue.observable<any>({ gcodePreview: { maxFlow: null }, config: { apiUrl: 'http://mock.local', uiSettings: { general: {} } }, printer: { printer: { print_stats: { filename: 'part.gcode', total_duration: 12 }, motion_report: { live_velocity: 43.27 } } } })
  const getters = Vue.observable<any>({ 'auth/getAuthenticated': true, 'socket/getConnectionState': true, 'socket/getApiConnected': true, 'printer/getKlippyReady': true, 'printer/getKlippyConnected': true, 'printer/getPrinterState': 'printing', 'printer/getHeaters': [nozzle, bed], 'printer/getAllFans': [fan], 'printer/getPrintProgress': 0.42123, 'printer/getTimeEstimates': {}, 'printer/getTempPresets': [], 'jobQueue/getQueuedJobs': [] })
  return { state, getters, mocks: { $store: { state, getters, dispatch: vi.fn() } }, stubs: { 'router-link': { template: '<a><slot /></a>' }, 'frame-icon': true } }
}

it('links every expandable tile to its unique exact-value field', async () => {
  const wrapper = mount(OverviewTiles, fixture())
  const triggers = wrapper.findAll('button[aria-expanded]')
  expect(triggers).toHaveLength(3)
  const controlledIds: string[] = []
  for (const trigger of triggers.wrappers) {
    const id = trigger.attributes('aria-controls')
    expect(id).toBeTruthy()
    if (!id) throw new Error('Expandable tile has no aria-controls')
    controlledIds.push(id)
    await trigger.trigger('click')
    expect(wrapper.find(`#${id}`).exists()).toBe(true)
  }
  expect(new Set(controlledIds).size).toBe(controlledIds.length)
  wrapper.destroy()
})
it.each([false, true])('opens exact heater and speed values on phone=%s and refuses after control is lost', async phone => {
  const f = fixture()
  const wrapper = mount(OverviewTiles, { ...f, propsData: { phone } })
  expect(wrapper.find('input[aria-label="Custom speed"]').exists()).toBe(true)
  await wrapper.find('[data-tid="tile-nozzle"] button').trigger('click')
  const input = wrapper.find('input[aria-label="Nozzle target"]')
  expect(input.exists()).toBe(true)
  await input.setValue('220'); await input.trigger('keydown', { key: 'Enter' })
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['SET_HEATER_TEMPERATURE HEATER=extruder TARGET=220'])
  f.getters['socket/getConnectionState'] = false
  await input.setValue('225'); await input.trigger('keydown', { key: 'Enter' })
  expect(socket.printerGcodeScript).toHaveBeenCalledTimes(1)
  wrapper.destroy(); socket.printerGcodeScript.mockClear()
})
it('makes Live numbers and exact progress available without a mode', async () => {
  const wrapper = mount(OverviewThisPrint, fixture())
  expect(wrapper.text()).toContain('Live numbers')
  const fold = wrapper.find('button[aria-expanded]')
  await fold.trigger('click')
  expect(wrapper.text()).toContain('42.123%')
  expect(wrapper.text()).toContain('43.27 mm/s')
  wrapper.destroy()
})

it('drops a numeric draft when the printer changes and refuses the old field emission', async () => {
  const f = fixture()
  const wrapper = mount(OverviewTiles, f)
  const oldField = wrapper.findComponent({ name: 'NumberField' })
  const input = wrapper.find('input[aria-label="Custom speed"]')
  await input.setValue('150')
  f.state.config.apiUrl = 'http://other.local'
  oldField.vm.$emit('change', 150)
  await Vue.nextTick()
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  expect((wrapper.find('input[aria-label="Custom speed"]').element as HTMLInputElement).value).toBe('100')
  wrapper.destroy(); socket.printerGcodeScript.mockClear()
})
