import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountSessions from '../AccountSessions.vue'
import { accountState } from '@/services/account/state'
import { AccountError } from '@/services/account/client'
import type { Session } from '@/services/account/api'

const endSession = vi.hoisted(() => vi.fn(async () => ({ ok: true })))
const endDevice = vi.hoisted(() => vi.fn(async () => ({ ok: true })))
const endSessions = vi.hoisted(() => vi.fn(async (): Promise<{ ok: boolean, ended?: number }> => ({ ok: true, ended: 1 })))
vi.mock('@/services/account/api', async (actual) => ({
  ...(await actual() as object),
  accountApi: { endSession, endDevice, endSessions }
}))
vi.mock('@/services/account/state', async (actual) => ({
  ...(await actual() as object),
  loadSessions: async () => {},
  loadEvents: async () => {}
}))
const beginSignOut = vi.hoisted(() => vi.fn())
vi.mock('@/services/account/sign-out', () => ({ beginSignOut }))

const NOW = Math.floor(Date.now() / 1000)

function session (id: string, label: string, extra: Partial<Session> = {}): Session {
  return { id, device: label, device_label: label, endpoint_id: null, kind: 'browser', client_id: null, created_at: NOW - 86400 * 10, last_used_at: NOW - 3600, expires_at: NOW + 86400 * 20, current: false, ...extra }
}

function open () {
  accountState.sessions = [
    session('s-here', 'Chrome on Windows', { current: true }),
    session('s-mac', 'Safari on a Mac')
  ]
  accountState.events = []
  return mount(AccountSessions, {
    propsData: { linkTo: (id: string) => `/account/${id}` },
    mocks: { $confirm: async () => true },
    stubs: { 'frame-icon': true, 'router-link': { template: '<a><slot /></a>' } }
  })
}

const settle = () => new Promise(resolve => setTimeout(resolve))

describe('Devices and sessions', () => {
  afterEach(() => {
    vi.clearAllMocks()
    accountState.sessions = null
    accountState.events = null
  })

  it('signs every other device out at once', async () => {
    const w = open()
    await w.find('[data-tid="sessions-everywhere-else"]').trigger('click')
    await settle()
    expect(endSessions).toHaveBeenCalledWith('others')
    expect(w.text()).toContain('Every other device is signed out.')
  })

  it('says it comes soon, and hides the button, on a console without it', async () => {
    endSessions.mockRejectedValueOnce(new AccountError('Not found.', 404, {}))
    const w = open()
    await w.find('[data-tid="sessions-everywhere-else"]').trigger('click')
    await settle()
    expect(w.text()).toContain('Signing every other device out at once comes soon.')
    expect(w.find('[data-tid="sessions-everywhere-else"]').exists()).toBe(false)
    expect(w.find('.acct-error').exists()).toBe(false)
  })

  it('signs one device out, and this browser through the sign-out', async () => {
    const w = open()
    const rows = w.findAll('[data-tid="sessions-device"]')
    expect(rows).toHaveLength(1)
    await rows.at(0).find('button').trigger('click')
    await settle()
    expect(endDevice).toHaveBeenCalledTimes(1)
    expect(endDevice).toHaveBeenCalledWith('s-mac')
    expect(endSession).not.toHaveBeenCalled()
    await w.find('[data-tid="sessions-this-device"] button').trigger('click')
    expect(beginSignOut).toHaveBeenCalled()
  })
})
