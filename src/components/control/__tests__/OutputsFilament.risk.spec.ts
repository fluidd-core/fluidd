import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ControlOutputs from '../ControlOutputs.vue'
import ControlFilament from '../ControlFilament.vue'
import { panelStore, panelStubs } from './panel-fixture'
import { cloudState } from '@/services/muon-cloud/state'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn(), printerQueryEndstops: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))

function options () {
  const store = panelStore()
  return {
    store,
    mountOptions: {
      mocks: { $store: store, $waits: {} },
      stubs: { ...panelStubs, 'material-picker': true }
    }
  }
}

const sent = () => socket.printerGcodeScript.mock.calls.map(call => call[0])
afterEach(() => { vi.clearAllMocks(); cloudState.account = null; cloudState.activePrinterId = null; cloudState.printers = [] })

describe('ControlOutputs boundary and stale-config refusal', () => {
  it.each([Number.NaN, -1, 100.01])('refuses the unsafe output percentage %s', percent => {
    const { store, mountOptions } = options()
    const pin = { key: 'output_pin case', name: 'case', prettyName: 'Case', controllable: true, pwm: true, scale: 1, value: 0 }
    store.getters['printer/getPins'] = [pin]
    const wrapper = mount(ControlOutputs, mountOptions)
    ;(wrapper.vm as any).setOutput((wrapper.vm as any).outputs[0], percent)
    expect(sent()).toEqual([])
    wrapper.destroy()
  })

  it('accepts both legal output endpoints', () => {
    const { store, mountOptions } = options()
    const pin = { key: 'output_pin case', name: 'case', prettyName: 'Case', controllable: true, pwm: true, scale: 1, value: 0 }
    store.getters['printer/getPins'] = [pin]
    const wrapper = mount(ControlOutputs, mountOptions)
    const out = (wrapper.vm as any).outputs[0]
    ;(wrapper.vm as any).setOutput(out, 0); (wrapper.vm as any).setOutput(out, 100)
    expect(sent()).toEqual(['SET_PIN PIN=case VALUE=0', 'SET_PIN PIN=case VALUE=1'])
    wrapper.destroy()
  })

  it('rechecks current sensor config rather than the role rendered before the click', async () => {
    const { store, mountOptions } = options()
    const sensor = { name: 'runout', prettyName: 'Runout', enabled: true, filament_detected: true }
    store.getters['printer/getRunoutSensors'] = [sensor]
    store.state.printer.printer.configfile = { settings: { 'filament_switch_sensor runout': { pause_on_runout: true } }, config: {} }
    const wrapper = mount(ControlOutputs, mountOptions)
    expect((wrapper.vm as any).sensors[0].role).toBe('runout')
    store.state.printer.printer.configfile = { settings: { 'filament_switch_sensor runout': { pause_on_runout: false, insert_gcode: 'LOAD_FILAMENT' } }, config: {} }
    await Vue.nextTick()
    ;(wrapper.vm as any).setSensor('runout', false)
    expect(sent()).toEqual([])
    wrapper.destroy()
  })
})

describe('ControlFilament extrusion and macro limits', () => {
  it('refuses zero length, and accepts exact maximum length and speed', () => {
    const { mountOptions } = options()
    const wrapper = mount(ControlFilament, mountOptions)
    const vm = wrapper.vm as any
    vm.length = 0; vm.speed = 20; vm.extrude(1)
    expect(sent()).toEqual([])
    vm.length = 50; vm.speed = 20; vm.extrude(1)
    expect(sent()).toEqual(['SAVE_GCODE_STATE NAME=_ui_retract\nM83\nG1 E50 F1200\nRESTORE_GCODE_STATE NAME=_ui_retract'])
    wrapper.destroy()
  })

  it.each([
    ['length above maximum', 50.01, 20],
    ['speed below minimum', 10, 0],
    ['speed above maximum', 10, 20.01]
  ])('refuses %s', (_label, length, speed) => {
    const { mountOptions } = options()
    const wrapper = mount(ControlFilament, mountOptions)
    const vm = wrapper.vm as any
    vm.length = length; vm.speed = speed; vm.extrude(1)
    expect(sent()).toEqual([])
    wrapper.destroy()
  })

  it('refuses a draft after its printer target changes', async () => {
    const { mountOptions } = options()
    const wrapper = mount(ControlFilament, mountOptions)
    const vm = wrapper.vm as any
    vm.length = 10; vm.speed = 5
    cloudState.account = { id: 'switched' } as any
    // Exercise the send-time target guard before the target watcher can reset the draft.
    vm.extrude(1)
    expect(sent()).toEqual([])
    await Vue.nextTick()
    wrapper.destroy()
  })

  it('blocks manual extrusion while busy and blocks load/unload macros while printing', () => {
    const { store, mountOptions } = options()
    store.getters['macros/getMacros'] = [
      { name: 'M600', config: { gcode: '' } },
      { name: 'LOAD_FILAMENT', config: { gcode: '' } },
      { name: 'UNLOAD_FILAMENT', config: { gcode: '' } }
    ]
    store.getters['printer/getPrinterState'] = 'printing'
    const wrapper = mount(ControlFilament, mountOptions)
    const vm = wrapper.vm as any
    vm.extrude(1); vm.run(vm.loadMacro); vm.run(vm.unloadMacro)
    expect(sent()).toEqual([])
    vm.run(vm.changeMacro)
    expect(sent()).toEqual(['M600'])
    wrapper.destroy()
  })

  it('blocks every filament action while a macro is running or control is absent', () => {
    for (const state of ['busy', 'no-control']) {
      const { store, mountOptions } = options()
      store.getters['macros/getMacros'] = [{ name: 'LOAD_FILAMENT', config: { gcode: '' } }]
      if (state === 'busy') store.getters['printer/getPrinterState'] = 'busy'
      else store.getters['auth/getAuthenticated'] = false
      const wrapper = mount(ControlFilament, mountOptions)
      const vm = wrapper.vm as any
      vm.extrude(1); vm.run(vm.loadMacro)
      expect(sent()).toEqual([])
      wrapper.destroy(); vi.clearAllMocks()
    }
  })
})
