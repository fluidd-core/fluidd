import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ControlActions from '../ControlActions.vue'
import { panelStore, panelStubs, waits } from './panel-fixture'
import { cloudState } from '@/services/muon-cloud/state'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
afterEach(() => { socket.printerGcodeScript.mockClear(); cloudState.account = null })

it('refuses a confirmation completed after the signed-in account changed', async () => {
  const store = panelStore()
  const confirm = vi.fn().mockImplementation(async () => { cloudState.account = { id: 'other' } as any; return true })
  const wrapper = mount(ControlActions, { mocks: { $store: store, $waits: waits, $route: { params: {} }, $confirm: confirm }, stubs: panelStubs })
  await (wrapper.vm as any).sendTypedGcode('RESTART')
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  cloudState.account = null; wrapper.destroy()
})

it('offers confirmed restarts with the mode off and refuses a print that starts during confirmation', async () => {
  const store = panelStore()
  const confirm = vi.fn().mockImplementation(async () => { store.getters['printer/getPrinterState'] = 'printing'; return true })
  const wrapper = mount(ControlActions, { mocks: { $store: store, $waits: waits, $route: { params: { printer: 'mock' } }, $confirm: confirm }, stubs: panelStubs })
  const restart = wrapper.find('[data-tid="restart-klipper"]')
  expect(restart.exists()).toBe(true)
  await restart.trigger('click'); await Promise.resolve(); await wrapper.vm.$nextTick()
  expect(confirm).toHaveBeenCalledTimes(1); expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  expect(wrapper.text()).toContain('Not sent')
  store.getters['printer/getPrinterState'] = 'ready'; confirm.mockResolvedValue(true)
  await wrapper.vm.$nextTick(); await restart.trigger('click'); await new Promise(resolve => setTimeout(resolve, 0))
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['RESTART'])
  wrapper.destroy()
})

it('keeps motors locked while paused and offers recovery restarts without Klipper ready', async () => {
  const store = panelStore()
  store.getters['printer/getPrinterState'] = 'paused'
  const wrapper = mount(ControlActions, { mocks: { $store: store, $waits: waits, $route: { params: {} }, $confirm: vi.fn().mockResolvedValue(true) }, stubs: panelStubs })
  const motors = wrapper.find('[data-tid="motors-off"]'); expect(motors.exists()).toBe(true)
  ;(wrapper.vm as any).motorsOff(); expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  store.getters['printer/getPrinterState'] = 'error'; store.getters['printer/getKlippyState'] = 'error'; store.getters['printer/getKlippyReady'] = false; store.getters['printer/getKlippyConnected'] = false
  await wrapper.vm.$nextTick()
  const firmware = wrapper.find('[data-tid="restart-firmware"]')
  expect(firmware.attributes('disabled')).toBeUndefined(); await firmware.trigger('click'); await new Promise(resolve => setTimeout(resolve, 0))
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['FIRMWARE_RESTART'])
  wrapper.destroy()
})
