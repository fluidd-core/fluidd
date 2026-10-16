import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BluetoothSetupDialog from '../BluetoothSetupDialog.vue'
import type { BleSetupResult } from '@/services/muon-ble/setup'
import type { NearbyPrinter } from '@/services/muon-ble/nearby'
import { resetSetupState, setupState } from '@/services/muon-setup/state'
import newState from '@/services/muon-setup/__tests__/fixtures/state.01-new.json'
import completeState from '@/services/muon-setup/__tests__/fixtures/state.08-complete-with-skips.json'

const WALNUT: NearbyPrinter = {
  deviceId: 'dev-walnut',
  device: {} as NearbyPrinter['device'],
  localName: 'walnut-8987',
  display: 'Walnut · 8987',
  endpointId: '3fa9c0de'.repeat(8),
  advert: null,
  heardAt: 1
}

const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v))

/** A session whose transport records every request, and a way to drop it. */
function session () {
  const requests: Array<{ path: string, method: string }> = []
  let drop: () => void = () => {}
  const closed = new Promise<void>(resolve => { drop = resolve })
  const close = vi.fn(async () => { drop() })
  const transport = {
    fetch: vi.fn(async (path: string, init?: RequestInit) => {
      requests.push({ path, method: init?.method ?? 'GET' })
      return new Response(JSON.stringify({ result: copy(newState) }), { status: 200 })
    })
  }
  const result: BleSetupResult = {
    ok: true,
    session: { printerId: WALNUT.endpointId!, code: 'F6QTDH', transport, state: copy(newState) as any, close, closed }
  }
  return { result, requests, close, drop: () => drop() }
}

const flush = async (wrapper: { vm: { $nextTick: () => Promise<void> } }) => {
  await new Promise(resolve => setTimeout(resolve, 0))
  await wrapper.vm.$nextTick()
}

function mount (connector: () => Promise<BleSetupResult>) {
  return shallowMount(BluetoothSetupDialog, {
    propsData: { value: true, printer: WALNUT, connector },
    mocks: { $t: (k: string) => k }
  })
}

const tid = (wrapper: ReturnType<typeof mount>, id: string) => wrapper.find(`[data-tid="${id}"]`)

beforeEach(() => resetSetupState())
afterEach(() => { vi.restoreAllMocks() })

describe('setup over Bluetooth from the hosted page', () => {
  it('connects, then shows the code grouped as the printer shows it', async () => {
    const s = session()
    const wrapper = mount(async () => s.result)
    expect(tid(wrapper, 'setup-ble-connecting').text()).toContain('Connecting over Bluetooth')
    await flush(wrapper)
    expect(tid(wrapper, 'setup-ble-compare').exists()).toBe(true)
    expect(tid(wrapper, 'ble-sas').text().replace(/\s+/g, '')).toBe('F6QTDH')
    expect(tid(wrapper, 'ble-sas').attributes('aria-label')).toBe('F 6 Q T D H')
    wrapper.destroy()
  })

  it('sends nothing but reads of the setup state before the person says the codes match', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const s = session()
      const wrapper = mount(async () => s.result)
      await flush(wrapper)
      await vi.advanceTimersByTimeAsync(10_000)
      expect(s.requests.length).toBeGreaterThanOrEqual(4)
      expect(s.requests.every(r => r.method === 'GET' && r.path === '/server/muon/setup')).toBe(true)
      wrapper.destroy()
    } finally {
      vi.useRealTimers()
    }
  })

  it('goes on to the steps over the same connection when they match', async () => {
    const s = session()
    const wrapper = mount(async () => s.result)
    await flush(wrapper)
    await (wrapper.vm as any).theyMatch()
    await wrapper.vm.$nextTick()
    expect(tid(wrapper, 'setup-ble-steps').exists()).toBe(true)
    expect(s.close).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it("hangs up when they don't match, and offers the printer's own Wi-Fi", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const s = session()
      const wrapper = mount(async () => s.result)
      await flush(wrapper)
      const reads = s.requests.length
      await (wrapper.vm as any).theyDiffer()
      await wrapper.vm.$nextTick()
      expect(s.close).toHaveBeenCalled()
      expect(tid(wrapper, 'setup-ble-mismatch').text()).toContain("That wasn't your printer")
      await vi.advanceTimersByTimeAsync(2500)
      // Nothing more after hanging up.
      expect(s.requests.length).toBe(reads)
      ;(wrapper.vm as any).phase = 'hotspot'
      await wrapper.vm.$nextTick()
      expect(tid(wrapper, 'setup-ble-hotspot').text()).toContain('Muon-walnut-8987')
      expect(tid(wrapper, 'setup-ble-hotspot').text()).toContain('http://10.42.0.1/setup')
      wrapper.destroy()
    } finally {
      vi.useRealTimers()
    }
  })

  it.each([
    ['unreachable', "Couldn't reach Walnut", true],
    ['busy', "Couldn't reach Walnut", true],
    ['set-up', 'Walnut is set up already', false],
    ['unsupported', "can't set printers up over Bluetooth yet", false]
  ] as const)('says why a session did not start: %s', async (reason, title, canRetry) => {
    const wrapper = mount(async () => ({ ok: false, reason, message: '' }))
    await flush(wrapper)
    expect(tid(wrapper, 'setup-ble-failed').text()).toContain(title)
    expect(tid(wrapper, 'ble-retry').exists()).toBe(canRetry)
    expect(tid(wrapper, 'ble-use-wifi').exists()).toBe(reason !== 'set-up')
  })

  it('tries again with a new connection', async () => {
    const connector = vi.fn(async (): Promise<BleSetupResult> => ({ ok: false, reason: 'unreachable', message: '' }))
    const wrapper = mount(connector)
    await flush(wrapper)
    await (wrapper.vm as any).connect()
    expect(connector).toHaveBeenCalledTimes(2)
  })

  it('says the connection dropped mid-setup, unless setup completed (muon-link hangs up then)', async () => {
    const s = session()
    const wrapper = mount(async () => s.result)
    await flush(wrapper)
    await (wrapper.vm as any).theyMatch()
    s.drop()
    await flush(wrapper)
    expect(tid(wrapper, 'setup-ble-lost').exists()).toBe(true)

    const done = session()
    const again = mount(async () => done.result)
    await flush(again)
    await (again.vm as any).theyMatch()
    setupState.state = copy(completeState) as any
    done.drop()
    await flush(again)
    expect(tid(again, 'setup-ble-steps').exists()).toBe(true)
    wrapper.destroy()
    again.destroy()
  })

  it('hangs up when the dialog closes', async () => {
    const s = session()
    const wrapper = mount(async () => s.result)
    await flush(wrapper)
    await wrapper.setProps({ value: false })
    await flush(wrapper)
    expect(s.close).toHaveBeenCalled()
  })
})
