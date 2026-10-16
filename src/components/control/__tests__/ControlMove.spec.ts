import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ControlMove from '../ControlMove.vue'
import { panelStore, panelStubs, waits } from './panel-fixture'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
afterEach(() => { socket.printerGcodeScript.mockClear() })

it.each([false, true])('opens Go to with limits and uses the configured speed on phone=%s', async phone => {
  const store = panelStore()
  const wrapper = mount(ControlMove, { propsData: { phone }, mocks: { $store: store, $waits: waits }, stubs: panelStubs })
  const door = wrapper.find('[data-tid="move-position"]')
  expect(door.exists()).toBe(true); await door.trigger('click')
  expect(wrapper.text()).toContain('0 to 200'); expect(wrapper.text()).toContain('130 mm/s')
  const x = wrapper.find('input[aria-label="X to go to"]')
  await x.setValue('120'); await x.trigger('keydown.enter')
  await wrapper.find('[data-tid="move-go"]').trigger('click')
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['SAVE_GCODE_STATE NAME=_ui_movement\nG90\nG1 X120 F7800\nRESTORE_GCODE_STATE NAME=_ui_movement'])
  wrapper.destroy()
})

it('keeps an exact draft when a changed limit or lost homing refuses it', async () => {
  const store = panelStore()
  const wrapper = mount(ControlMove, { mocks: { $store: store, $waits: waits }, stubs: panelStubs })
  const vm = wrapper.vm as any
  vm.setGoTo(0, 190); store.state.printer.printer.toolhead.axis_maximum = [180, 174, 160]; vm.go()
  expect(vm.goTo[0]).toBe(190)
  store.state.printer.printer.toolhead.homed_axes = ''; vm.go()
  expect(socket.printerGcodeScript).not.toHaveBeenCalled(); wrapper.destroy()
})
