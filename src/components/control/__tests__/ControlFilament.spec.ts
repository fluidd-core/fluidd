import Vue from 'vue'
import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ControlFilament from '../ControlFilament.vue'
import MaterialPicker from '@/components/overview/MaterialPicker.vue'

const choices = [
  { name: 'PLA', nozzle: 215, bed: 60, colour: '#E8A53B', presetId: null },
  { name: 'PETG', nozzle: 240, bed: 80, colour: '#5B7FD6', presetId: null }
]

function setup (variables: Record<string, unknown>) {
  const printer = Vue.observable({ save_variables: { variables }, printing: false, paused: false })
  return {
    printer,
    options: {
      mocks: {
        $store: {
          state: { printer: { printer }, config: { uiSettings: { general: {} } } },
          getters: { 'spoolman/getActiveSpool': { filament: { material: 'PETG', name: 'Old spool', color_hex: 'F07B22' } } }
        }
      },
      computed: {
        klippyReady: () => true,
        materialChoices: () => choices,
        printerPrinting: () => printer.printing,
        printerPaused: () => printer.paused
      },
      stubs: { 'frame-icon': true }
    }
  }
}

describe('the loaded filament controls', () => {
  it('keeps the picker available with Spoolman and gives the saved record precedence', async () => {
    const s = setup({ muon_material: 'PLA', muon_material_colour: '2F63C6' })
    const wrapper = shallowMount(ControlFilament, {
      ...s.options,
      stubs: { 'control-card': { template: '<div><slot name="aside" /><slot /></div>' } }
    })
    expect(wrapper.findComponent(MaterialPicker).exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Old spool')
    s.printer.save_variables.variables = {}
    await Vue.nextTick()
    expect(wrapper.findComponent(MaterialPicker).exists()).toBe(true)
    wrapper.destroy()
  })

  it('shows external colour changes without sending them back', async () => {
    const s = setup({ muon_material: 'PLA', muon_material_colour: 'F07B22' })
    const send = vi.fn()
    const wrapper = shallowMount(MaterialPicker, {
      ...s.options,
      propsData: { chip: true },
      methods: { sendGcode: send },
      stubs: { ...s.options.stubs, 'v-menu': { template: '<div><slot name="activator" :on="{}" :attrs="{}" /><slot /></div>' } }
    })
    expect(wrapper.text()).toContain('PLA · Orange')
    s.printer.save_variables.variables = { muon_material: 'PETG', muon_material_colour: '2F63C6' }
    await Vue.nextTick()
    expect(wrapper.text()).toContain('PETG · Blue')
    expect(send).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('locks material while paused, while a colour choice still writes the canonical key', () => {
    const s = setup({ muon_material: 'PLA', muon_material_colour: 'F07B22' })
    s.printer.paused = true
    const send = vi.fn()
    const wrapper = shallowMount(MaterialPicker, { ...s.options, propsData: { chip: true }, methods: { sendGcode: send } })
    const vm = wrapper.vm as any
    vm.choose(choices[1])
    expect(send).not.toHaveBeenCalled()
    vm.chooseColour('#2f63c6')
    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith('SAVE_VARIABLE VARIABLE=muon_material_colour VALUE=\'"2F63C6"\'')
    wrapper.destroy()
  })
})
