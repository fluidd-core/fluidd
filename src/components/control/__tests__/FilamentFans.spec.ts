import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ControlFilament from '../ControlFilament.vue'
import ControlFans from '../ControlFans.vue'
import { panelStore, panelStubs, waits } from './panel-fixture'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn(), printerQueryEndstops: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'mock' }))
afterEach(() => { socket.printerGcodeScript.mockClear() })

it('puts manual extrusion beside the loading state and rechecks cold, busy and configured limits', async () => {
  const store = panelStore()
  store.getters['printer/getRunoutSensors'] = [{ name: 'loader', prettyName: 'Loader', enabled: true, filament_detected: true }]
  store.state.printer.printer.configfile.settings['filament_switch_sensor loader'] = { insert_gcode: 'INSERT_FILAMENT_SENSOR' }
  const wrapper = mount(ControlFilament, { mocks: { $store: store, $waits: waits }, stubs: { ...panelStubs, MaterialPicker: true } })
  expect(wrapper.text()).toContain('Always on'); expect(wrapper.text()).toContain('Filament in')
  expect(wrapper.find('[data-tid="extrude"]').exists()).toBe(true)
  const vm = wrapper.vm as any
  vm.extrude(1)
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['SAVE_GCODE_STATE NAME=_ui_retract\nM83\nG1 E10 F300\nRESTORE_GCODE_STATE NAME=_ui_retract'])
  socket.printerGcodeScript.mockClear()
  store.extruder.can_extrude = false; vm.extrude(1)
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  store.extruder.can_extrude = true; store.getters['printer/getPrinterState'] = 'paused'; vm.extrude(-1)
  store.getters['printer/getPrinterState'] = 'ready'; vm.length = 51; vm.extrude(1)
  vm.length = 10; vm.speed = 21; vm.extrude(1)
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  vm.speed = 5; store.state.config.apiUrl = 'http://other.local'; vm.extrude(1)
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  store.getters['printer/getRunoutSensors'][0].enabled = false
  await wrapper.vm.$nextTick(); expect(wrapper.text()).toContain('Automatic loading is off')
  wrapper.destroy()
})

it('shows automatic fans as readings and sends only an adjustable fan command', async () => {
  const store = panelStore()
  store.getters['printer/getAllFans'] = [
    { key: 'fan', name: 'fan', prettyName: 'Part fan', type: 'fan', speed: 0.5 },
    { key: 'heater_fan hotend', name: 'hotend', prettyName: 'Hotend', type: 'heater_fan', speed: 0 },
    { key: 'fan_generic aux', name: 'aux', prettyName: 'Aux', type: 'fan_generic', speed: 0.3 }
  ]
  const wrapper = mount(ControlFans, { mocks: { $store: store, $waits: waits }, stubs: panelStubs })
  const fold = wrapper.find('#fans\\.all-trigger')
  expect(fold.exists()).toBe(true); await fold.trigger('click')
  expect(wrapper.text()).toContain('Hotend'); expect(wrapper.text()).toContain('with the nozzle heater')
  const vm = wrapper.vm as any
  vm.setFan(store.getters['printer/getAllFans'][1], 0)
  vm.setFan(store.getters['printer/getAllFans'][2], 40)
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['SET_FAN_SPEED FAN=aux SPEED=0.4'])
  store.getters['socket/getConnectionState'] = false; vm.setFan(store.getters['printer/getAllFans'][2], 50)
  expect(socket.printerGcodeScript).toHaveBeenCalledTimes(1)
  wrapper.destroy()
})

it('keeps a runout-only sensor switch in Filament and refuses loader or unknown off requests', async () => {
  const store = panelStore()
  store.getters['printer/getRunoutSensors'] = [{ name: 'runout', prettyName: 'Runout', enabled: true, filament_detected: true }]
  store.state.printer.printer.configfile.settings = {
    'filament_switch_sensor runout': { pause_on_runout: true },
    'filament_switch_sensor loader': { insert_gcode: 'INSERT_FILAMENT_SENSOR' }
  }
  const wrapper = mount(ControlFilament, { mocks: { $store: store, $waits: waits }, stubs: { ...panelStubs, MaterialPicker: true } })
  const toggle = wrapper.find('[aria-label="Runout on"]')
  expect(toggle.exists()).toBe(true); await toggle.trigger('click')
  const vm = wrapper.vm as any
  vm.setRunout('loader', false)
  store.state.printer.printer.configfile = undefined; vm.setRunout('runout', false)
  store.getters['auth/getAuthenticated'] = false; vm.setRunout('runout', true)
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['SET_FILAMENT_SENSOR SENSOR=runout ENABLE=0'])
  wrapper.destroy()
})

it('retains filament macro availability as metadata and only permits the guided change while printing', async () => {
  const store = panelStore()
  store.getters['macros/getMacros'] = [{ name: 'm600', config: { gcode: 'PAUSE' } }, { name: 'load_filament', config: { gcode: 'M109 S210' } }]
  const wrapper = mount(ControlFilament, { mocks: { $store: store, $waits: waits }, stubs: { ...panelStubs, MaterialPicker: true } })
  const vm = wrapper.vm as any
  store.getters['auth/getAuthenticated'] = false; await wrapper.vm.$nextTick()
  expect(vm.changeMacro?.name).toBe('M600')
  store.getters['auth/getAuthenticated'] = true
  store.getters['printer/getPrinterState'] = 'printing'; await wrapper.vm.$nextTick()
  vm.run(vm.loadMacro); vm.run(vm.changeMacro)
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['M600'])
  wrapper.destroy()
})
