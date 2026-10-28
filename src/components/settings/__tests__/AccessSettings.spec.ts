import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AccessClient, AccessState, Capability } from '@/services/muon-access/api'

const client = {
  get: vi.fn(),
  capabilities: vi.fn(),
  setEntry: vi.fn(),
  setPrivateUploads: vi.fn(),
  setData: vi.fn(),
  setLevels: vi.fn(),
  request: vi.fn(),
  requestStatus: vi.fn(),
  cancelRequest: vi.fn()
}

vi.mock('@/services/muon-access/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/muon-access/api')>()),
  currentPrinterAccess: () => client as unknown as AccessClient
}))

const { default: AccessSettings } = await import('../AccessSettings.vue')

// Cases from Moonraker's tests/assets/muon_access_contract.json.
const homeGuest: AccessState = {
  owner: { kind: 'account', email: 'sam@example.com' },
  entry: 'open',
  you: { level: 'signed-out-guest', role: 'operator', trusted: false, principal: 'anyone at home' },
  ways: { email: { on: false }, link: { on: false }, password: { on: false }, approve: { on: false } },
  privateUploads: false,
  dataMode: 'shared',
  levelsPreset: 'relaxed'
}

const ownerDevice: AccessState = {
  ...homeGuest,
  entry: 'protected',
  you: { level: 'admin', role: 'operator', trusted: true, principal: 'device:sam-phone' },
  levelsPreset: 'standard'
}

function mount (state: AccessState, capabilities: Record<string, Capability>) {
  client.get.mockResolvedValue(state)
  client.capabilities.mockResolvedValue(capabilities)
  return shallowMount(AccessSettings, {
    mocks: {
      $store: { getters: { 'config/getDisplayName': 'Boxwood · 367A' }, state: {} }
    }
  })
}

async function settle () {
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('AccessSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('names the owner, read-only: the link decides it', async () => {
    const wrapper = mount(homeGuest, { protection: 'ask' })
    await settle()
    expect((wrapper.vm as any).ownerText).toBe('Linked to sam@example.com')
  })

  it('asks at the printer, rather than writing, when a guest at home changes the entry', async () => {
    const wrapper = mount(homeGuest, { print: 'allowed', protection: 'ask' })
    await settle()

    ;(wrapper.vm as any).changeEntry('protected')

    expect(client.setEntry).not.toHaveBeenCalled()
    expect((wrapper.vm as any).asking).toEqual({ kind: 'entry', entry: 'protected' })
    expect((wrapper.vm as any).askingOpen).toBe(true)
    // The other settings cannot be asked for: they say only the owner can change them.
    expect((wrapper.vm as any).ownerOnly).toBe(true)
  })

  it('offers nothing to change to a Viewer', async () => {
    const wrapper = mount({ ...homeGuest, you: { ...homeGuest.you, role: 'viewer' } }, { read: 'allowed', protection: 'refused' })
    await settle()
    expect((wrapper.vm as any).cannot('protection')).toBe(true)
    expect((wrapper.vm as any).entryHint).toContain('Only the owner can change this')
  })

  it('writes the entry from the owner’s trusted device', async () => {
    client.setEntry.mockResolvedValue(true)
    const wrapper = mount(ownerDevice, { protection: 'allowed' })
    await settle()

    await (wrapper.vm as any).changeEntry('open')

    expect(client.setEntry).toHaveBeenCalledWith('open')
    expect((wrapper.vm as any).message).toBe('')
  })

  it('says a change the printer did not apply was not made, and shows what the printer holds', async () => {
    client.setEntry.mockResolvedValue(false)
    const wrapper = mount(ownerDevice, { protection: 'allowed' })
    await settle()
    const before = (wrapper.vm as any).renderKey

    await (wrapper.vm as any).changeEntry('open')

    expect((wrapper.vm as any).message).toBe('Not changed: only the owner can change this.')
    // Read again, and the controls re-rendered from that read.
    expect(client.get).toHaveBeenCalledTimes(2)
    expect((wrapper.vm as any).renderKey).toBeGreaterThan(before)
    expect((wrapper.vm as any).state.entry).toBe('protected')
  })

  it('lists what this browser may do, in the words the app uses', async () => {
    const wrapper = mount(homeGuest, { print: 'allowed', wifi: 'allowed', hotspot: 'refused', protection: 'ask' })
    await settle()
    expect((wrapper.vm as any).capabilityRows.map((r: any) => [r.action, r.value])).toEqual([
      ['print', 'allowed'], ['wifi', 'allowed'], ['hotspot', 'refused'], ['protection', 'ask']
    ])
  })

  it('shows heating on its own row when the printer has one (KAN-878)', async () => {
    const wrapper = mount(homeGuest, { motion: 'allowed', heat: 'allowed' })
    await settle()
    const rows = wrapper.findAll('[data-capability]').wrappers
    expect(rows.map(w => w.attributes('data-capability'))).toEqual(['motion', 'heat'])
    expect(rows[0].text()).toContain('Move and run macros')
    expect(rows[0].text()).not.toContain('heat')
    expect(rows[1].text()).toContain('Heat the nozzle and bed')
  })
})
