import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AccountConnectedApps from '../AccountConnectedApps.vue'
import { AccountError } from '@/services/account/client'
import {
  appName,
  isLoopback,
  lastUsedText,
  orderApps,
  whereText,
  type ConnectedApp
} from '@/services/account/connectedApps'

const connectedApps = vi.hoisted(() => vi.fn())
const disconnectApp = vi.hoisted(() => vi.fn(async () => ({ ok: true, client_id: 'dcr_1', sessions_ended: 1 })))
vi.mock('@/services/account/api', async (actual) => ({
  ...(await actual() as object),
  accountApi: { connectedApps, disconnectApp }
}))

const NOW = Math.floor(Date.now() / 1000)

// The console's example row (console-api contract, 27 Oct).
function app (extra: Partial<ConnectedApp> = {}): ConnectedApp {
  return {
    client_id: 'dcr_1',
    name: 'Claude',
    verified: false,
    known: true,
    redirect_hosts: ['claude.ai'],
    client_uri: 'https://claude.ai',
    logo_uri: 'https://claude.ai/logo.png',
    scopes: ['printers:read', 'account:read'],
    approved_at: NOW - 86400 * 3,
    last_used_at: NOW - 300,
    sessions: 1,
    current: false,
    ...extra
  }
}

const control = (): ConnectedApp => app({ client_id: 'fluidd', name: 'Muon3D Control', verified: true, redirect_hosts: ['control.muon3d.com'], client_uri: null, logo_uri: null, current: true })

const settle = () => new Promise(resolve => setTimeout(resolve))

function open (confirm = true) {
  const $confirm = vi.fn(async () => confirm)
  const w = mount(AccountConnectedApps, {
    mocks: { $confirm },
    stubs: { 'frame-icon': true, 'router-link': { props: ['to'], template: '<a :href="to"><slot /></a>' } }
  })
  return { w, $confirm }
}

describe('Connected apps', () => {
  beforeEach(() => {
    connectedApps.mockResolvedValue({ apps: [] })
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows the empty state, pointing scripts to access tokens', async () => {
    const { w } = open()
    await settle()
    expect(w.find('[data-tid="apps-empty"]').exists()).toBe(true)
    expect(w.find('[data-tid="apps-to-tokens"]').attributes('href')).toBe('/account/tokens')
  })

  it('says the list comes soon when the console has no such route', async () => {
    connectedApps.mockRejectedValue(new AccountError('Not found', 404, {}))
    const { w } = open()
    await settle()
    expect(w.find('[data-tid="apps-missing"]').exists()).toBe(true)
    expect(w.find('[data-tid="apps-error"]').exists()).toBe(false)
  })

  it('lists a self-registered app as unchecked, with where it signs in, its scopes in words and when it was used', async () => {
    connectedApps.mockResolvedValue({ apps: [app()] })
    const { w } = open()
    await settle()
    const row = w.find('[data-tid="apps-row"]')
    expect(row.text()).toContain('Claude')
    expect(row.find('[data-tid="apps-unverified"]').text()).toBe('Muon3D did not check this app')
    expect(row.find('[data-tid="apps-where"]').text()).toBe('Signs in from claude.ai')
    expect(row.find('[data-tid="apps-scope-printers:read"]').text()).toBe('See your printers and how they\'re doing')
    expect(row.find('[data-tid="apps-scope-account:read"]').text()).toBe('See your name and sign-in details')
    expect(row.find('[data-tid="apps-used"]').text()).toContain('Used 5 minutes ago')
    // The app's logo is never loaded.
    expect(w.find('img').exists()).toBe(false)
  })

  it('shows Ask mode on a switch that cannot be changed yet', async () => {
    connectedApps.mockResolvedValue({ apps: [app()] })
    const { w } = open()
    await settle()
    const ask = w.find('[data-tid="apps-ask"]')
    expect(ask.attributes('aria-checked')).toBe('true')
    expect(ask.attributes('disabled')).toBeDefined()
    expect(w.find('[data-tid="apps-row"]').text()).toContain('Ask mode')
  })

  it('renders what the app says about itself as text, not HTML', async () => {
    connectedApps.mockResolvedValue({ apps: [app({ name: '<img src=x onerror=alert(1)>' })] })
    const { w } = open()
    await settle()
    expect(w.find('img').exists()).toBe(false)
    expect(w.find('[data-tid="apps-row"] b').text()).toBe('<img src=x onerror=alert(1)>')
  })

  it('puts Control first, marks it, and offers no Disconnect on it', async () => {
    connectedApps.mockResolvedValue({ apps: [app(), control()] })
    const { w } = open()
    await settle()
    const rows = w.findAll('[data-tid="apps-row"]')
    expect(rows.at(0).find('[data-tid="apps-current"]').exists()).toBe(true)
    expect(rows.at(0).find('[data-tid="apps-revoke"]').exists()).toBe(false)
    expect(rows.at(1).find('[data-tid="apps-revoke"]').exists()).toBe(true)
  })

  it('disconnects an app by its client id after asking, then reads the list again', async () => {
    connectedApps
      .mockResolvedValueOnce({ apps: [app()] })
      .mockResolvedValueOnce({ apps: [] })
    const { w, $confirm } = open()
    await settle()
    await w.find('[data-tid="apps-revoke"]').trigger('click')
    await settle()
    expect($confirm).toHaveBeenCalledOnce()
    expect(disconnectApp).toHaveBeenCalledWith('dcr_1')
    expect(connectedApps).toHaveBeenCalledTimes(2)
    expect(w.find('[data-tid="apps-message"]').text()).toContain('Claude is disconnected.')
    expect(w.find('[data-tid="apps-empty"]').exists()).toBe(true)
  })

  it('leaves an app alone when the person says no', async () => {
    connectedApps.mockResolvedValue({ apps: [app()] })
    const { w } = open(false)
    await settle()
    await w.find('[data-tid="apps-revoke"]').trigger('click')
    await settle()
    expect(disconnectApp).not.toHaveBeenCalled()
  })

  it('says why a disconnect was refused, and still reads the list again', async () => {
    connectedApps.mockResolvedValue({ apps: [app()] })
    disconnectApp.mockRejectedValueOnce(new AccountError('That is this app.', 409, { code: 'current_app' }))
    const { w } = open()
    await settle()
    await w.find('[data-tid="apps-revoke"]').trigger('click')
    await settle()
    expect(w.find('[data-tid="apps-error"]').text()).toContain('sign out instead')
    expect(connectedApps).toHaveBeenCalledTimes(2)
  })
})

describe('connected app words', () => {
  it('knows a loopback redirect from a website', () => {
    expect(isLoopback('127.0.0.1:33418')).toBe(true)
    expect(isLoopback('[::1]:8080')).toBe(true)
    expect(isLoopback('localhost')).toBe(true)
    expect(isLoopback('localhost.example.com')).toBe(false)
    expect(isLoopback('127.0.0.1.example.com')).toBe(false)
  })

  it('says where an app signs in from', () => {
    expect(whereText({ redirect_hosts: ['127.0.0.1:33418'] })).toBe('A program on your computer')
    expect(whereText({ redirect_hosts: ['claude.ai', 'localhost:9000'] })).toBe('claude.ai and a program on your computer')
    expect(whereText({ redirect_hosts: [] })).toBe('Nowhere it named')
  })

  it('names an app that is gone, and one with no live session', () => {
    expect(appName({ name: null })).toBe('An app that no longer exists')
    expect(lastUsedText({ last_used_at: null, sessions: 0 })).toBe('Not signed in now')
    expect(lastUsedText({ last_used_at: NOW, sessions: 2 })).toBe('Used just now · signed in 2 times')
  })

  it('keeps the console order but puts this app first', () => {
    const ids = orderApps([app({ client_id: 'a' }), control(), app({ client_id: 'b' })]).map(a => a.client_id)
    expect(ids).toEqual(['fluidd', 'a', 'b'])
  })
})
