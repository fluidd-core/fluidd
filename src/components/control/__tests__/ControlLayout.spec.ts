import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import Control from '@/views/Control.vue'
import { panelStore, panelStubs, waits } from './panel-fixture'

vi.mock('@/api/socketActions', () => ({ SocketActions: { printerGcodeScript: vi.fn(), printerQueryEndstops: vi.fn() } }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'mock' }))

it.each([false, true])('keeps all six task panels with either legacy setting on phone=%s', phone => {
  const store = panelStore()
  store.state.printer.printer.configfile.settings.input_shaper = { shaper_type_x: 'mzv', shaper_freq_x: 47.4, shaper_type_y: 'mzv', shaper_freq_y: 71.4 }
  for (const pro of [false, true]) {
    localStorage.setItem('muon3d.pro', pro ? '1' : '0')
    const wrapper = mount(Control, { mocks: { $store: store, $waits: waits, $route: { params: { printer: 'mock' } } }, computed: { isMobileViewport: () => phone }, stubs: { ...panelStubs, MaterialPicker: true } })
    for (const name of ['heat', 'move', 'filament', 'speed', 'fans', 'macros']) expect(wrapper.findAll(`[data-tid="control-${name}"]`).length).toBe(1)
    expect(wrapper.find('[data-tid="control-shaper"]').exists()).toBe(false)
    expect(wrapper.find('[data-tid="control-endstops"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-tid="control-retraction"]').length).toBe(0)
    if (phone) expect(wrapper.find('[data-tid="control-actions"]').exists()).toBe(true)
    wrapper.destroy()
  }
  localStorage.setItem('muon3d.pro', '0')
})

it('drops the previous printer’s macro form when the selected connection changes', async () => {
  const store = panelStore()
  store.state.printer.printer.configfile.settings['gcode_macro UNLOAD_FILAMENT'] = { gcode: '{params.TEMP | default(210)}' }
  const wrapper = mount(Control, { mocks: { $store: store, $waits: waits, $route: { params: { printer: 'mock' } } }, computed: { isMobileViewport: () => false }, stubs: { ...panelStubs, MaterialPicker: true } })
  await wrapper.find('[data-tid="macro-UNLOAD_FILAMENT"]').trigger('click')
  expect(wrapper.find('[data-tid="macro-send"]').exists()).toBe(true)
  store.state.config.apiUrl = 'http://other.local'; await wrapper.vm.$nextTick()
  expect(wrapper.find('[data-tid="macro-send"]').exists()).toBe(false)
  wrapper.destroy()
})
