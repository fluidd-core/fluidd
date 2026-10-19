import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ControlHeat from '../ControlHeat.vue'
import ControlMacros from '../ControlMacros.vue'
import { panelStore, panelStubs, waits } from './panel-fixture'
import { cloudState } from '@/services/muon-cloud/state'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn(), printerEmergencyStop: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'alpha' }))

function show (component: any) {
  const store = panelStore()
  const route = Vue.observable({ params: { printer: 'alpha' } })
  const confirm = vi.fn().mockResolvedValue(true)
  const wrapper = mount(component, {
    mocks: { $store: store, $route: route, $confirm: confirm, $waits: waits },
    stubs: panelStubs
  })
  return { wrapper, vm: wrapper.vm as any, store, route, confirm }
}

const sent = () => socket.printerGcodeScript.mock.calls.map(call => call[0])
afterEach(() => {
  vi.clearAllMocks()
  cloudState.account = null
  cloudState.activePrinterId = null
  cloudState.printers = []
})

describe('ControlHeat asynchronous cooldown guard', () => {
  it('sends nothing when the busy-printer warning is cancelled', async () => {
    const { wrapper, vm, store, confirm } = show(ControlHeat)
    store.getters['printer/getPrinterState'] = 'printing'
    confirm.mockResolvedValue(false)
    await vm.coolDown()
    expect(sent()).toEqual([])
    wrapper.destroy()
  })

  it.each(['printer', 'account', 'connection', 'control'] as const)('rechecks %s after cooldown confirmation', async change => {
    const { wrapper, vm, store, route, confirm } = show(ControlHeat)
    store.getters['printer/getPrinterState'] = 'printing'
    confirm.mockImplementation(async () => {
      if (change === 'printer') route.params.printer = 'beta'
      if (change === 'account') cloudState.account = { id: 'other' } as any
      if (change === 'connection') store.getters['socket/getConnectionState'] = false
      if (change === 'control') store.getters['auth/getAuthenticated'] = false
      return true
    })
    await vm.coolDown()
    expect(sent()).toEqual([])
    wrapper.destroy()
  })
})

describe('typed Control commands recheck after restart dialogs', () => {
  it('does not send a restart when confirmation is cancelled', async () => {
    const { wrapper, vm, confirm } = show(ControlMacros)
    confirm.mockResolvedValue(false)
    expect(await vm.sendTypedGcode('FIRMWARE_RESTART')).toBe(false)
    expect(sent()).toEqual([])
    wrapper.destroy()
  })

  it.each(['printer', 'account', 'connection', 'control', 'busy', 'config'] as const)('refuses a typed restart after %s changes in its dialog', async change => {
    const { wrapper, vm, store, route, confirm } = show(ControlMacros)
    confirm.mockImplementation(async () => {
      if (change === 'printer') route.params.printer = 'beta'
      if (change === 'account') cloudState.account = { id: 'other' } as any
      if (change === 'connection') store.getters['socket/getConnectionState'] = false
      if (change === 'control') store.getters['auth/getAuthenticated'] = false
      if (change === 'busy') store.getters['printer/getPrinterState'] = 'printing'
      if (change === 'config') store.state.printer.printer.configfile = { settings: {}, config: {}, warnings: ['changed'] }
      return true
    })
    const result = await vm.sendTypedGcode('FIRMWARE_RESTART')
    if (change === 'config') {
      // A benign config refresh does not alter the safety classification, so the restart remains valid.
      expect(result).toBe(true)
      expect(sent()).toEqual(['FIRMWARE_RESTART'])
    } else {
      expect(result).toBe(false)
      expect(sent()).toEqual([])
    }
    wrapper.destroy()
  })
})
