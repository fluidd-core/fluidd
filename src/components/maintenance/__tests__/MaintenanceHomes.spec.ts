import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import Maintenance from '@/views/Maintenance.vue'
import ControlTuning from '@/components/control/ControlTuning.vue'
import ControlOutputs from '@/components/control/ControlOutputs.vue'
import { panelStore, panelStubs, waits } from '@/components/control/__tests__/panel-fixture'
import { proMode } from '@/services/pro-mode'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn(), printerQueryEndstops: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'mock' }))

function show (phone = false) {
  const store = panelStore()
  Vue.set(store.state.printer.printer, 'gcode', { commands: { BED_MESH_CALIBRATE: {}, PROBE_CALIBRATE: {}, SHAPER_CALIBRATE: {}, PID_CALIBRATE: {}, PROBE_ACCURACY: {} } })
  Object.assign(store.state.printer.printer.configfile.settings, {
    input_shaper: { shaper_type_x: 'mzv', shaper_freq_x: 47.4, shaper_type_y: 'ei', shaper_freq_y: 71.4 },
    probe: { z_offset: 0.075 },
    extruder: { control: 'pid', pid_kp: 17.485, pid_ki: 1.85, pid_kd: 41.308 },
    'filament_switch_sensor loader': { insert_gcode: 'INSERT_FILAMENT_SENSOR' }
  })
  const extras = {
    'printer/getHomedAxes': () => true,
    'printer/getSaveConfigPendingItems': {},
    'server/componentSupport': () => true,
    'history/getRollUp': { total_print_time: 763200 },
    'mesh/getSupportsBedMesh': false,
    'printer/getProbe': { name: 'probe', last_query: false },
    'printer/getPrinterSettings': (name: string) => store.state.printer.printer.configfile.settings[name]
  }
  for (const [key, value] of Object.entries(extras)) Vue.set(store.getters, key, value)
  store.getters['printer/getRunoutSensors'] = [{ name: 'loader', prettyName: 'Toolhead loader', enabled: true, filament_detected: true }]
  const wrapper = mount(Maintenance, {
    mocks: { $store: store, $vuetify: { breakpoint: { mobile: phone } }, $route: { params: { printer: 'mock' } }, $waits: { ...waits, onQueryProbe: 'query' }, $confirm: vi.fn().mockResolvedValue(false) },
    computed: { isMobileViewport: () => phone },
    stubs: { ...panelStubs, 'router-link': { template: '<a><slot /></a>' } }
  })
  return { wrapper, store }
}
afterEach(() => { vi.clearAllMocks(); proMode.on = false })

it.each([false, true])('opens Health results and diagnosis without a mode, phone=%s', async phone => {
  const { wrapper } = show(phone)
  for (const id of ['bedMesh', 'firstLayer', 'shaper', 'pid', 'sensors']) {
    const trigger = wrapper.find(`[id="maintenance.${id}-trigger"]`)
    expect(trigger.exists()).toBe(true)
    expect(trigger.attributes('aria-expanded')).toBe('false')
    await trigger.trigger('click')
    expect(trigger.attributes('aria-expanded')).toBe('true')
  }
  expect(wrapper.text()).toContain('0.075 mm')
  expect(wrapper.text()).toContain('17.485')
  expect(wrapper.find('[data-tid="control-shaper"]').isVisible()).toBe(true)
  expect(wrapper.find('[data-tid="control-endstops"]').isVisible()).toBe(true)
  expect(wrapper.find('[data-tid="check-nozzle"]').text()).toContain('Nothing to do')
  expect(wrapper.find('[data-tid="check-nozzle"]').text()).toContain('212 h')
  expect(wrapper.find('[data-tid="control-sensors"]').text()).toContain('always on')
  expect(wrapper.find('[data-tid="control-sensors"] [role="switch"]').exists()).toBe(false)
  wrapper.destroy()
})

it('keeps an input shaper editable when no measurement command is supported', async () => {
  const { wrapper, store } = show()
  store.state.printer.printer.gcode.commands = {}
  await Vue.nextTick()
  expect(wrapper.find('[id="maintenance.shaper-trigger"]').exists()).toBe(true)
  const tuning = wrapper.findComponent(ControlTuning)
  ;(tuning.vm as any).setShaper('x', { freq: 52.5 })
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['SET_INPUT_SHAPER SHAPER_TYPE_X=mzv SHAPER_FREQ_X=52.5'])
  wrapper.destroy()
})

it('uses a reported shaper instead of config and refuses malformed, out-of-range and stale edits', async () => {
  const { wrapper, store } = show()
  store.state.console.console.push({ type: 'response', time: 10, message: '// shaper_type_x:ei shaper_freq_x:51.2' })
  await Vue.nextTick()
  const tuning = wrapper.findComponent(ControlTuning)
  expect(tuning.exists()).toBe(true)
  const vm = tuning.vm as any
  expect(vm.shaper('x')).toEqual({ type: 'ei', freq: 51.2 })
  for (const change of [{ freq: NaN }, { freq: 301 }, { freq: -1 }, { type: 'mzv\nG28' }]) vm.setShaper('x', change)
  store.getters['auth/getAuthenticated'] = false
  vm.setShaper('x', { freq: 40 }); vm.readShaper()
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  wrapper.destroy()
})

it('queries only endstops from their home and shows unknown states honestly', async () => {
  const { wrapper, store } = show()
  const outputs = wrapper.findComponent(ControlOutputs)
  expect(outputs.exists()).toBe(true)
  ;(outputs.vm as any).checkEndstops()
  expect(socket.printerQueryEndstops).toHaveBeenCalledTimes(1)
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  store.getters['printer/getEndstops'] = [{ name: 'x', state: 'unknown' }]
  store.getters['printer/getRunoutSensors'] = [{ name: 'loader', prettyName: 'Toolhead loader' }]
  await Vue.nextTick()
  expect(outputs.text()).toContain('Unknown')
  expect(outputs.text()).not.toContain('no filament')
  store.getters['auth/getAuthenticated'] = false
  ;(outputs.vm as any).checkEndstops()
  expect(socket.printerQueryEndstops).toHaveBeenCalledTimes(1)
  wrapper.destroy()
})

it('shows unknown nozzle history and no invented calibration result on an unsupported printer', async () => {
  const { wrapper, store } = show()
  store.state.printer.printer.gcode.commands = {}
  store.state.printer.printer.configfile.settings = {}
  store.getters['server/componentSupport'] = () => false
  store.getters['printer/getProbe'] = undefined
  await Vue.nextTick()
  expect(wrapper.find('[data-tid="check-nozzle"]').exists()).toBe(true)
  expect(wrapper.find('[data-tid="check-nozzle"]').text()).toContain('Hours unavailable')
  expect(wrapper.text()).not.toContain('Good')
  expect(wrapper.find('[data-tid="maintenance-mesh"]').exists()).toBe(false)
  wrapper.destroy()
})

it('does not turn an empty offset report into zero', async () => {
  const { wrapper, store } = show()
  store.state.printer.printer.configfile.settings = { probe: { z_offset: '' } }
  await Vue.nextTick()
  expect(wrapper.find('[data-tid="check-firstLayer"]').text()).not.toContain('0.000 mm')
  wrapper.destroy()
})
