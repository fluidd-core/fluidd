import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ControlMacros from '../ControlMacros.vue'
import { panelStore, panelStubs, waits } from './panel-fixture'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'mock' }))
afterEach(() => { socket.printerGcodeScript.mockClear() })

function show () {
  const store = panelStore()
  store.state.printer.printer.configfile.settings = {
    'gcode_macro UNLOAD_FILAMENT': { gcode: '{% set temp = params.TEMP | default(210) | float %}\nM109 S{temp}' },
    'gcode_macro MOVE_CUSTOM': { gcode: 'G1 X{params.X | float} Y{params.Y | default(20) | float}' }
  }
  const wrapper = mount(ControlMacros, { mocks: { $store: store, $waits: waits, $route: { params: { printer: 'mock' } } }, stubs: panelStubs })
  return { store, wrapper }
}

it('asks for optional values, omits blanks so Klipper uses its default and previews the exact command', async () => {
  const { wrapper } = show()
  await wrapper.find('[data-tid="macro-UNLOAD_FILAMENT"]').trigger('click')
  const temp = wrapper.find('textarea[aria-label="Macro TEMP"]')
  expect(temp.exists()).toBe(true); expect(wrapper.text()).toContain('210')
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  await wrapper.find('[data-tid="macro-send"]').trigger('submit')
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['UNLOAD_FILAMENT'])
  await wrapper.find('[data-tid="macro-UNLOAD_FILAMENT"]').trigger('click')
  await wrapper.find('textarea[aria-label="Macro TEMP"]').setValue('215')
  expect(wrapper.text()).toContain('UNLOAD_FILAMENT TEMP=215')
  await wrapper.find('[data-tid="macro-send"]').trigger('submit')
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['UNLOAD_FILAMENT', 'UNLOAD_FILAMENT TEMP=215'])
  wrapper.destroy()
})

it('requires missing values and refuses separators, quoting and stale printer context without sending', async () => {
  const { store, wrapper } = show()
  const button = wrapper.find('[data-tid="macro-MOVE_CUSTOM"]')
  expect(button.attributes('disabled')).toBeUndefined(); await button.trigger('click')
  await wrapper.find('[data-tid="macro-send"]').trigger('submit')
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  const x = wrapper.find('textarea[aria-label="Macro X"]')
  for (const value of ['10\nM84', '10;M84', '"10"', 'NaN', 'Infinity', '10 Y=30', '10#comment']) {
    await x.setValue(value); await wrapper.find('[data-tid="macro-send"]').trigger('submit')
    expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  }
  await x.setValue('120'); store.state.config.apiUrl = 'http://other.local'
  await wrapper.find('[data-tid="macro-send"]').trigger('submit')
  expect(socket.printerGcodeScript).not.toHaveBeenCalled(); wrapper.destroy()
})

it('keeps the full groups one step away and reveals search results without opening a global mode', async () => {
  const { wrapper } = show()
  expect(wrapper.find('[data-tid="macro-group-moving"]').isVisible()).toBe(false)
  await wrapper.find('input[aria-label="Find a macro"]').setValue('MOVE_CUSTOM')
  expect(wrapper.find('[data-tid="macro-group-moving"]').isVisible()).toBe(true)
  wrapper.destroy()
})
