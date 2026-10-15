import { describe, expect, it, vi } from 'vitest'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import store from '@/store'

const discovery = vi.hoisted(() => ({
  discoverPrinters: vi.fn(async () => {}),
  refreshCloudNearby: vi.fn(async () => {}),
  refreshKnownPrinters: vi.fn(async () => {}),
  refreshLanStatus: vi.fn(async () => {}),
  lanAddresses: vi.fn(() => []),
  lanFetch: vi.fn(),
  discoveryState: { scanning: false, network: '', found: [], cloud: [], cloudChecked: false, finishedAt: 0, blockedByPage: false }
}))
vi.mock('@/services/muon-cloud/discovery', () => discovery)
const idle = vi.hoisted(() => ({ afterFirstPaint: vi.fn() }))
vi.mock('@/services/startup/idle', () => idle)
vi.mock('@/services/foreign-printers/live', () => ({
  liveForeign: { records: [], status: {} },
  loadForeign: vi.fn(async () => {}),
  connectAll: vi.fn(async () => {}),
  forget: vi.fn(async () => {})
}))
vi.mock('@/services/muon-ble/nearby', () => ({
  nearbyState: { printers: [], support: 'unsupported', radio: 'on' },
  startNearby: vi.fn(async () => {}),
  stopNearby: vi.fn(),
  lookNearby: vi.fn(),
  isPrinter: vi.fn(() => false)
}))

const { default: Printers } = await import('../Printers.vue')

describe('the Printers page on its first load', () => {
  it('asks the console which printers are here at once, and sweeps the network only after the first paint', () => {
    // 14 Oct: every load of app.muon3d.com sent 500+ LAN requests while the
    // page was still loading.
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    const wrapper = shallowMount(Printers, {
      localVue,
      router: new VueRouter({ mode: 'abstract', routes: [] }),
      computed: { isMobileViewport: () => false, perRow: () => 2 },
      mocks: { $store: store, $vuetify: { breakpoint: { mobile: false } } }
    })

    expect(discovery.refreshCloudNearby).toHaveBeenCalledOnce()
    expect(discovery.discoverPrinters).not.toHaveBeenCalled()
    const painted = idle.afterFirstPaint.mock.calls[0][0] as () => void
    painted()
    expect(discovery.discoverPrinters).toHaveBeenCalledOnce()
    wrapper.destroy()
  })
})
