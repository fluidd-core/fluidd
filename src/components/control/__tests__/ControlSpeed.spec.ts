import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ControlSpeed from '../ControlSpeed.vue'
import { panelStore, panelStubs, waits } from './panel-fixture'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
afterEach(() => { socket.printerGcodeScript.mockClear() })

it('offers Custom and Fine-tune, retains the previous PA and puts it back', async () => {
  const store = panelStore()
  const wrapper = mount(ControlSpeed, { mocks: { $store: store, $waits: waits }, stubs: panelStubs })
  const custom = wrapper.find('[data-tid="speed-custom"]')
  expect(custom.exists()).toBe(true); await custom.trigger('click')
  const speed = wrapper.find('input[aria-label="Speed"]')
  await speed.setValue('110'); await speed.trigger('keydown.enter')
  const fold = wrapper.find('#speed\\.fine-trigger'); expect(fold.exists()).toBe(true); await fold.trigger('click')
  const pa = wrapper.find('input[aria-label="Pressure advance"]')
  await pa.setValue('0.08'); await pa.trigger('keydown.enter')
  store.extruder.pressure_advance = 0.08; await wrapper.vm.$nextTick()
  const back = wrapper.find('[data-tid="put-back-Pressure advance"]')
  expect(back.exists()).toBe(true); await back.trigger('click')
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['M220 S110', 'SET_PRESSURE_ADVANCE ADVANCE=0.08', 'SET_PRESSURE_ADVANCE ADVANCE=0.076'])
  expect(wrapper.text()).toContain('until Klipper restarts')
  wrapper.destroy()
})

it('sets firmware retraction and refuses a cruise ratio above one or a stale disabled action', async () => {
  const store = panelStore()
  const wrapper = mount(ControlSpeed, { mocks: { $store: store, $waits: waits }, stubs: panelStubs })
  const retract = wrapper.find('input[aria-label="Retract"]')
  expect(retract.exists()).toBe(true); await retract.setValue('1.2'); await retract.trigger('keydown.enter')
  const ratio = wrapper.find('input[aria-label="Minimum cruise ratio"]')
  await ratio.setValue('1.1'); await ratio.trigger('keydown.enter')
  store.getters['socket/getConnectionState'] = false
  ;(wrapper.vm as any).setLimit('VELOCITY', 100)
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['SET_RETRACTION RETRACT_LENGTH=1.2'])
  wrapper.destroy()
})
