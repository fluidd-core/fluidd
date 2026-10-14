import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

const discovery = vi.hoisted(() => ({
  discoverPrinters: vi.fn(async () => {}),
  refreshKnownPrinters: vi.fn(async () => {}),
  discoveryState: { scanning: false, network: '', found: [], cloud: [], cloudChecked: false, finishedAt: 0 },
  instanceFor: vi.fn(),
  instanceForHost: vi.fn(),
  lanAddresses: vi.fn(() => [])
}))
const nearby = vi.hoisted(() => ({
  lookNearby: vi.fn(),
  nearbyState: { printers: [], scanning: false, error: null, supported: false },
  startNearby: vi.fn(async () => {}),
  stopNearby: vi.fn()
}))

// The switcher's services reach the network, the account and Bluetooth.
// Only when it starts searching is under test.
vi.mock('@/services/muon-cloud/discovery', () => discovery)
vi.mock('@/services/muon-ble/nearby', () => nearby)
vi.mock('@/services/muon-ble/link', () => ({ useBluetoothFor: vi.fn() }))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { account: null, printers: [], status: {}, activePrinterId: null } }))
vi.mock('@/services/muon-cloud/activate', () => ({
  activateCloudPrinter: vi.fn(),
  activateLocalPrinter: vi.fn(),
  activationState: { switching: null, error: null, fallbackUrl: null }
}))
vi.mock('@/services/muon-access/api', () => ({ lanPrinterAccess: vi.fn() }))

const { default: PrinterSwitcher } = await import('../PrinterSwitcher.vue')

const mocks = {
  $t: (key: string) => key,
  $store: {
    state: { config: { apiUrl: '', instances: [], uiSettings: { general: { enableKeyboardShortcuts: true } } }, socket: { open: false } },
    getters: { 'config/getInstances': [], 'config/getCurrentInstance': null },
    dispatch: vi.fn()
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('PrinterSwitcher', () => {
  it('does not search the network while it is closed', () => {
    // Once opened it stays mounted, closed, in the header. Searching on
    // mount swept the network on every load, about 510 requests over 24 s.
    shallowMount(PrinterSwitcher, { mocks, propsData: { visible: false } })
    expect(discovery.discoverPrinters).not.toHaveBeenCalled()
    expect(nearby.startNearby).not.toHaveBeenCalled()
  })

  it('finds an offline printer by the address it was saved at', async () => {
    const wrapper = shallowMount(PrinterSwitcher, { mocks, propsData: { visible: false } })
    const vm = wrapper.vm as unknown as { query: string, matches: (e: unknown) => boolean }
    const workshop = { name: 'Workshop', host: null, saved: [{ apiUrl: 'http://192.168.1.50' }] }
    vm.query = '192.168.1.50'
    expect(vm.matches(workshop)).toBe(true)
    vm.query = 'workshop'
    expect(vm.matches(workshop)).toBe(true)
    vm.query = '10.0.0.9'
    expect(vm.matches(workshop)).toBe(false)
  })

  it('searches when it opens', async () => {
    const wrapper = shallowMount(PrinterSwitcher, { mocks, propsData: { visible: false } })
    await wrapper.setProps({ visible: true })
    expect(discovery.discoverPrinters).toHaveBeenCalledTimes(1)
    expect(nearby.startNearby).toHaveBeenCalledTimes(1)
    wrapper.destroy()
  })
})
