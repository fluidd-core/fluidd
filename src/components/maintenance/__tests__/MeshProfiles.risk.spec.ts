import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MeshProfiles from '../MeshProfiles.vue'
import { panelStore, panelStubs, waits } from '@/components/control/__tests__/panel-fixture'
import { cloudState } from '@/services/muon-cloud/state'
import { running } from '@/services/maintenance/running'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'alpha' }))

type Profile = { name: string; range: number; active: boolean; adaptive?: boolean }

function show (profiles: Profile[] = [
  { name: 'default', range: 0.1, active: true },
  { name: 'spare', range: 0.2, active: false },
  { name: 'adaptive-auto', range: 0.05, active: false, adaptive: true }
]) {
  const store = panelStore()
  Vue.set(store.state.printer.printer, 'bed_mesh', { profile_name: 'default' })
  Vue.set(store.state.printer.printer, 'gcode', { commands: { BED_MESH_CALIBRATE: {} } })
  Vue.set(store.getters, 'mesh/getBedMeshProfiles', profiles)
  Vue.set(store.getters, 'printer/getHomedAxes', () => true)
  Vue.set(store.getters, 'printer/getSaveConfigPending', false)
  Vue.set(store.getters, 'printer/getSaveConfigPendingItems', {})
  const route = Vue.observable({ params: { printer: 'alpha' } })
  const confirm = vi.fn().mockResolvedValue(true)
  const wrapper = mount(MeshProfiles, {
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
  running.check = null
})

describe('MeshProfiles risky confirmation paths', () => {
  it.each([
    ['load', ['spare']],
    ['remove', ['spare']],
    ['clear', []],
    ['calibrate', null]
  ] as const)('a cancelled %s confirmation sends nothing', async (_label, args) => {
    const { wrapper, vm, store, confirm } = show()
    confirm.mockResolvedValue(false)
    store.getters['printer/getPrinterState'] = 'printing'
    if (_label === 'calibrate') await vm.runCheck(vm.meshRow)
    else await vm[_label](...(args as readonly ['spare']))
    expect(sent()).toEqual([])
    wrapper.destroy()
  })

  it.each(['route', 'account'] as const)('refuses load, clear, remove and calibration after a %s switch while confirming', async change => {
    for (const action of ['load', 'clear', 'remove', 'calibrate'] as const) {
      const { wrapper, vm, store, route, confirm } = show()
      store.getters['printer/getPrinterState'] = 'printing'
      confirm.mockImplementation(async () => {
        if (change === 'route') route.params.printer = 'beta'
        else cloudState.account = { id: 'other' } as any
        return true
      })
      if (action === 'load') await vm.load('spare')
      else if (action === 'remove') await vm.remove('spare')
      else if (action === 'clear') await vm.clear()
      else await vm.runCheck(vm.meshRow)
      expect(sent()).toEqual([])
      wrapper.destroy()
      vi.clearAllMocks()
      cloudState.account = null
    }
  })

  it.each(['load', 'clear', 'remove', 'calibrate'] as const)('refuses %s when control is lost after confirmation', async action => {
    const { wrapper, vm, store, confirm } = show()
    store.getters['printer/getPrinterState'] = 'printing'
    confirm.mockImplementation(async () => { store.getters['auth/getAuthenticated'] = false; return true })
    if (action === 'load') await vm.load('spare')
    else if (action === 'remove') await vm.remove('spare')
    else if (action === 'clear') await vm.clear()
    else await vm.runCheck(vm.meshRow)
    expect(sent()).toEqual([])
    wrapper.destroy()
  })

  it('refuses invalid, absent, and adaptive profiles even when handlers are invoked directly', async () => {
    const { wrapper, vm, confirm } = show()
    await vm.load('bad\nM112')
    await vm.load('missing')
    await vm.remove('bad\nM112')
    await vm.remove('missing')
    await vm.remove('adaptive-auto')
    expect(confirm).not.toHaveBeenCalled()
    expect(sent()).toEqual([])
    wrapper.destroy()
  })

  it('loads and clears immediately while idle, but confirms and sends only after consent while printing', async () => {
    const idle = show()
    await idle.vm.load('spare'); await idle.vm.clear()
    expect(idle.confirm).not.toHaveBeenCalled()
    expect(sent()).toEqual(['BED_MESH_PROFILE LOAD="spare"', 'BED_MESH_CLEAR'])
    idle.wrapper.destroy(); vi.clearAllMocks()

    const printing = show()
    printing.store.getters['printer/getPrinterState'] = 'printing'
    await printing.vm.load('spare'); await printing.vm.clear()
    expect(printing.confirm).toHaveBeenCalledTimes(2)
    expect(sent()).toEqual(['BED_MESH_PROFILE LOAD="spare"', 'BED_MESH_CLEAR'])
    printing.wrapper.destroy()
  })
})
