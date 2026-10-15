import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CloudAccountMenu from '../CloudAccountMenu.vue'
import { cloudState } from '@/services/muon-cloud/state'

vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { account: { id: 'sample', name: 'Sample Person', email: 'sample@example.test', created_at: 1 }, printers: [] } }))
vi.mock('@/services/muon-cloud/centralLogin', () => ({ centralLoginEnabled: () => false }))
vi.mock('@/services/account/state', () => ({ accountState: { approvals: [] }, loadApprovals: async () => {} }))
vi.mock('@/services/account/sign-out', () => ({ beginSignOut: vi.fn() }))
vi.mock('@/components/layout/AppUserMenu.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/settings/auth/UserPasswordDialog.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../CloudAccountDialog.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../LinkPrinterDialog.vue', () => ({ default: { template: '<div />' } }))

function open (endpointId: string | null) {
  return shallowMount(CloudAccountMenu, {
    mocks: {
      $store: {
        state: { config: { apiUrl: 'http://sample.local' }, socket: { open: true } },
        getters: {
          'config/getDisplayName': 'Sample M1',
          'config/getInstances': [{ apiUrl: 'http://sample.local', endpointId }],
          'auth/getCurrentUser': null
        }
      }
    },
    stubs: {
      'v-menu': { template: '<div><slot name="activator" :on="{}" :attrs="{}" /><slot /></div>' },
      'router-link': { template: '<a><slot /></a>' },
      'frame-icon': true
    }
  })
}

describe('ownership on a printer own page', () => {
  afterEach(() => { cloudState.printers = [] })
  it('shows ownership only for the exact local identity linked by this account', () => {
    cloudState.printers = [{ id: 'p1', name: 'Sample M1', model: 'M1', version: 'mock', linked_at: 1, last_seen: 1, online: false, online_since: null, role: 'operator', shared: false }]
    const w = open('p1')
    expect(w.text()).toContain('You own it')
    w.destroy()
    const other = open('p2')
    expect(other.text()).not.toContain('You own it')
    other.destroy()
  })
  it('does not turn a shared Operator into an owner', () => {
    cloudState.printers = [{ id: 'p1', name: 'Sample M1', model: 'M1', version: 'mock', linked_at: 1, last_seen: 1, online: false, online_since: null, role: 'operator', shared: true }]
    const w = open('p1')
    expect(w.text()).not.toContain('You own it')
    w.destroy()
  })
})
