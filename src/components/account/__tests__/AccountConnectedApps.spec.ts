import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AccountConnectedApps from '../AccountConnectedApps.vue'
import { AccountError } from '@/services/account/client'
import {
  askText,
  isLoopback,
  lastUsedText,
  orderApps,
  whereText,
  type ConnectedApp
} from '@/services/account/connectedApps'

const connections = vi.hoisted(() => vi.fn())
const revokeConnection = vi.hoisted(() => vi.fn(async () => ({ id: 'c1', revoked: true })))
vi.mock('@/services/account/api', async (actual) => ({
  ...(await actual() as object),
  accountApi: { connections, revokeConnection }
}))

const NOW = Math.floor(Date.now() / 1000)

function app (extra: Partial<ConnectedApp> = {}): ConnectedApp {
  return {
    id: 'c1',
    client_id: 'dyn_abc',
    name: 'Claude Desktop',
    kind: 'mcp',
    verified: false,
    redirect_host: '127.0.0.1:33418',
    client_uri: null,
    scopes: ['printers:read', 'library:read'],
    ask_mode: 'ask',
    bypass_until: null,
    approved_at: NOW - 86400 * 3,
    last_used_at: NOW - 300,
    last_used_via: 'mcp',
    ...extra
  }
}

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
    connections.mockResolvedValue({ connections: [] })
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
    connections.mockRejectedValue(new AccountError('Not found', 404, {}))
    const { w } = open()
    await settle()
    expect(w.find('[data-tid="apps-missing"]').exists()).toBe(true)
    expect(w.find('[data-tid="apps-error"]').exists()).toBe(false)
  })

  it('lists an app with where it signs in, its scopes in words, when it was used and that it asks first', async () => {
    connections.mockResolvedValue({ connections: [app()] })
    const { w } = open()
    await settle()
    const row = w.find('[data-tid="apps-row"]')
    expect(row.text()).toContain('Claude Desktop')
    expect(row.find('[data-tid="apps-unverified"]').exists()).toBe(true)
    expect(row.text()).toContain('Through MCP')
    expect(row.find('[data-tid="apps-where"]').text()).toBe('A program on your computer')
    expect(row.find('[data-tid="apps-scope-printers:read"]').text()).toBe('See your printers and how they\'re doing')
    expect(row.find('[data-tid="apps-scope-library:read"]').text()).toBe('Read your Library')
    expect(row.find('[data-tid="apps-used"]').text()).toContain('Used 5 minutes ago through MCP')
    const ask = row.find('[data-tid="apps-ask-ask"]')
    expect(ask.attributes('aria-checked')).toBe('true')
    expect(ask.attributes('disabled')).toBeDefined()
    expect(row.text()).toContain('Asks you first')
  })

  it('shows Bypass with its end, and the switch off', async () => {
    connections.mockResolvedValue({ connections: [app({ verified: true, ask_mode: 'bypass', bypass_until: NOW + 3600 * 8, kind: 'oauth', redirect_host: 'tools.example.com', client_uri: 'https://example.com' })] })
    const { w } = open()
    await settle()
    const row = w.find('[data-tid="apps-row"]')
    expect(row.find('[data-tid="apps-unverified"]').exists()).toBe(false)
    expect(row.find('[data-tid="apps-ask-bypass"]').attributes('aria-checked')).toBe('false')
    expect(row.text()).toContain('Bypass')
    expect(row.text()).toContain('Acts without asking until')
    expect(row.find('[data-tid="apps-where"]').text()).toBe('tools.example.com · example.com')
  })

  it('disconnects an app after asking, then reads the list again', async () => {
    connections
      .mockResolvedValueOnce({ connections: [app()] })
      .mockResolvedValueOnce({ connections: [] })
    const { w, $confirm } = open()
    await settle()
    await w.find('[data-tid="apps-revoke"]').trigger('click')
    await settle()
    expect($confirm).toHaveBeenCalledOnce()
    expect(revokeConnection).toHaveBeenCalledWith('c1')
    expect(connections).toHaveBeenCalledTimes(2)
    expect(w.find('[data-tid="apps-message"]').text()).toContain('Claude Desktop is disconnected.')
    expect(w.find('[data-tid="apps-empty"]').exists()).toBe(true)
  })

  it('leaves an app alone when the person says no', async () => {
    connections.mockResolvedValue({ connections: [app()] })
    const { w } = open(false)
    await settle()
    await w.find('[data-tid="apps-revoke"]').trigger('click')
    await settle()
    expect(revokeConnection).not.toHaveBeenCalled()
  })

  it('says why a disconnect was refused, and still reads the list again', async () => {
    connections.mockResolvedValue({ connections: [app()] })
    revokeConnection.mockRejectedValueOnce(new AccountError('Forbidden', 403, { code: 'interactive_only' }))
    const { w } = open()
    await settle()
    await w.find('[data-tid="apps-revoke"]').trigger('click')
    await settle()
    expect(w.find('[data-tid="apps-error"]').text()).toContain('signed-in browser')
    expect(connections).toHaveBeenCalledTimes(2)
  })
})

describe('connected app words', () => {
  it('knows a loopback redirect from a website', () => {
    expect(isLoopback('127.0.0.1:33418')).toBe(true)
    expect(isLoopback('[::1]:8080')).toBe(true)
    expect(isLoopback('localhost')).toBe(true)
    expect(isLoopback('localhost.example.com')).toBe(false)
    expect(isLoopback('127.0.0.1.example.com')).toBe(false)
    expect(whereText({ redirect_host: null })).toBe('Unknown')
  })

  it('names how an app was last used', () => {
    expect(lastUsedText({ last_used_at: null })).toBe('Never used')
    expect(lastUsedText({ last_used_at: NOW, last_used_via: 'api' })).toBe('Used just now through the API')
  })

  it('treats a Bypass that has ended as asking again', () => {
    expect(askText({ ask_mode: 'bypass', bypass_until: NOW - 60 })).toBe('Asks you first (Bypass ended)')
    expect(askText({ ask_mode: 'bypass', bypass_until: null })).toBe('Acts without asking')
  })

  it('puts the most recently used first', () => {
    const ids = orderApps([
      app({ id: 'old', last_used_at: NOW - 9000 }),
      app({ id: 'new', last_used_at: NOW - 10 }),
      app({ id: 'never', last_used_at: null, approved_at: NOW - 100 })
    ]).map(a => a.id)
    expect(ids).toEqual(['new', 'never', 'old'])
  })
})
