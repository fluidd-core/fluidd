import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import OverviewObjects from '../OverviewObjects.vue'
const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
it('skips a real object once and refuses a context change during confirmation', async () => {
  const state = Vue.observable<any>({ config: { apiUrl: 'http://mock.local' }, printer: { printer: { exclude_object: { objects: [{ name: 'part_1' }], excluded_objects: [] } } } })
  const getters = Vue.observable<any>({ 'auth/getAuthenticated': true, 'socket/getConnectionState': true, 'socket/getApiConnected': true, 'printer/getKlippyReady': true, 'printer/getKlippyConnected': true, 'printer/getPrinterState': 'printing' })
  let change = false
  const wrapper = mount(OverviewObjects, { mocks: { $store: { state, getters, dispatch: vi.fn() }, $confirm: async () => { if (change) state.config.apiUrl = 'http://other.local'; return true } } })
  await wrapper.find('button').trigger('click'); await Vue.nextTick(); await Vue.nextTick()
  expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['EXCLUDE_OBJECT NAME=part_1'])
  change = true
  await wrapper.find('button').trigger('click'); await Vue.nextTick(); await Vue.nextTick()
  expect(socket.printerGcodeScript).toHaveBeenCalledTimes(1)
  wrapper.destroy(); socket.printerGcodeScript.mockClear()
})
