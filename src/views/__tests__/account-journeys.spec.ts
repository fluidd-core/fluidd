import { mount, shallowMount, type Wrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AccountDelete from '@/components/account/AccountDelete.vue'
import AccountSessions from '@/components/account/AccountSessions.vue'
import AccountSecurity from '@/components/account/AccountSecurity.vue'
import DeletionBanner from '@/components/account/DeletionBanner.vue'
import CloudAccountMenu from '@/components/muon-cloud/CloudAccountMenu.vue'
import { accountState, loadMe } from '@/services/account/state'
import { cloudState } from '@/services/muon-cloud/state'
import { deletionState } from '@/services/muon-cloud/deletion'
import { TOKEN_KEY, setCloudBaseUrl } from '@/services/muon-cloud/api'

const passkey = vi.hoisted(() => ({ cancelled: false, pending: false, release: null as null | (() => void) }))
const beginSignOut = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('@/services/account/sign-out', async (actual) => ({ ...(await actual() as object), beginSignOut }))
vi.mock('@/services/account/webauthn', async (actual) => ({
  ...(await actual() as object),
  passkeysSupported: () => true,
  usePasskey: () => passkey.pending
    ? new Promise((resolve, reject) => { passkey.release = () => passkey.cancelled ? reject(new DOMException('Cancelled', 'NotAllowedError')) : resolve({ id: 'credential' }) })
    : passkey.cancelled ? Promise.reject(new DOMException('Cancelled', 'NotAllowedError')) : Promise.resolve({ id: 'credential' })
}))
vi.mock('@/services/library/store', () => ({
  libraryState: { enabled: false, usedBytes: null },
  libraryItems: () => [],
  libraryPrints: () => [],
  refreshLibrary: async () => {},
  watchLibraryAccount: () => {}
}))

type Call = { method: string, path: string, body: unknown, token: string | null }
const NOW = 1_800_000_000

class FakeConsole {
  account = { id: 'a1', email: 'jack@muon3d.com', name: 'Jack', created_at: NOW - 1000, has_password: true, two_step: false, deletion: null as null | { requested_at: number, delete_after: number } }
  sessions = [
    this.session('browser-here', true),
    this.session('client-here', false, 'browser-here', 'rotating'),
    this.session('browser-away', false),
    this.session('client-away', false, 'browser-away', 'rotating')
  ]

  tokens = new Map([['token-jack', 'a1']])
  calls: Call[] = []
  delete401 = false
  password = 'old password'
  reauthenticated = false

  session (id: string, current: boolean, parent_id: string | null = null, kind: 'browser' | 'rotating' = 'browser') {
    return { id, device: 'Chrome on Windows', device_label: 'Chrome on Windows', endpoint_id: null, kind, client_id: null, parent_id, created_at: NOW - 100, last_used_at: NOW, expires_at: NOW + 1000, current }
  }

  fetch = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(String(input)); const method = init.method ?? 'GET'
    const body = init.body ? JSON.parse(String(init.body)) : undefined
    const token = ((init.headers as Record<string, string> | undefined)?.authorization ?? '').replace('Bearer ', '') || null
    this.calls.push({ method, path: url.pathname + url.search, body, token })
    const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } })
    if (!token || this.tokens.get(token) !== 'a1') return json({ error: 'the account changed' }, 401)
    if (method === 'GET' && url.pathname === '/v1/me') return json({ account: this.account, endpoint_id: null, session_id: 'browser-here', sign_in: { password: true, passkeys: 1, identities: [], two_step: false } })
    if (method === 'GET' && url.pathname === '/v1/me/sessions') return json({ sessions: this.sessions })
    if (method === 'GET' && url.pathname === '/v1/me/events') return json({ events: [] })
    if (method === 'GET' && url.pathname === '/v1/config') return json({ passkey_rp_id: 'console.test' })
    if (method === 'GET' && url.pathname === '/v1/me/passkeys') return json({ passkeys: [{ id: 'key-1', name: 'Laptop', created_at: NOW, last_used_at: NOW }] })
    if (method === 'GET' && url.pathname === '/v1/me/identities') return json({ identities: [] })
    if (method === 'DELETE' && url.pathname === '/v1/me/sessions' && url.search === '?scope=others') {
      const family = new Set(['browser-here', 'client-here']); this.sessions = this.sessions.filter(s => family.has(s.id)); return json({ ok: true, ended: 2 })
    }
    if (method === 'POST' && url.pathname === '/v1/me/reauth/passkey/options') return json({ ceremony_id: 'ceremony-1', options: { publicKey: {} }, expires_at: NOW + 1000 })
    if (method === 'POST' && url.pathname === '/v1/me/reauth/passkey') { this.reauthenticated = true; return json({ ok: true }) }
    if (method === 'DELETE' && url.pathname === '/v1/me') {
      if (this.delete401) return json({ error: 'your session ended; sign in and try again' }, 401)
      this.account.deletion = { requested_at: NOW, delete_after: NOW + 14 * 86400 }
      this.sessions = []; this.tokens.clear()
      return json({ ok: true, delete_after: this.account.deletion.delete_after })
    }
    if (method === 'POST' && url.pathname === '/v1/me/deletion/cancel') { this.account.deletion = null; return json({ ok: true, account: this.account }) }
    if (method === 'PUT' && url.pathname === '/v1/me/password') {
      if (!this.reauthenticated) return json({ error: 'confirm it is you', reauth_required: true }, 403)
      this.reauthenticated = false; this.password = body.new_password; return json({ ok: true })
    }
    return json({ error: `unhandled ${method} ${url.pathname}` }, 404)
  })
}

const dialog = { props: ['value', 'title'], template: '<div v-if="value" class="dialog"><h2>{{ title }}</h2><slot/><slot name="actions"/></div>' }
const stubs = { M3Dialog: dialog, 'm3-dialog': dialog, 'frame-icon': true, 'router-link': { template: '<a><slot/></a>' } }
const settle = async () => { await new Promise(resolve => setTimeout(resolve)); await new Promise(resolve => setTimeout(resolve)) }
const tid = (w: Wrapper<Vue>, id: string) => w.find(`[data-tid="${id}"]`)

describe('account journeys against one stateful console', () => {
  let console: FakeConsole
  beforeEach(async () => {
    console = new FakeConsole(); vi.stubGlobal('fetch', console.fetch)
    setCloudBaseUrl('https://console.test'); localStorage.setItem(TOKEN_KEY, 'token-jack')
    cloudState.account = { ...console.account }; accountState.accountId = 'a1'; accountState.me = null
    accountState.sessions = null; accountState.events = null; deletionState.deleteAfter = null
    passkey.cancelled = false; passkey.pending = false; passkey.release = null
    await loadMe()
  })

  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); localStorage.clear(); setCloudBaseUrl(null) })

  it('keeps this browser family when two identically labelled devices sign out everywhere else', async () => {
    const w = mount(AccountSessions, { propsData: { linkTo: () => '/account/security' }, mocks: { $confirm: async () => true }, stubs })
    await settle()
    const rows = w.findAll('[data-tid="sessions-this-device"], [data-tid="sessions-device"]')
    expect(rows).toHaveLength(2); expect(rows.at(0).text()).toContain('Chrome on Windows'); expect(rows.at(1).text()).toContain('Chrome on Windows')
    await tid(w, 'sessions-everywhere-else').trigger('click'); await settle()
    expect(console.sessions.map(s => s.id)).toEqual(['browser-here', 'client-here'])
    expect(localStorage.getItem(TOKEN_KEY)).toBe('token-jack'); expect(w.text()).toContain('Every other device is signed out.')
  })

  it('schedules once with a passkey, signs every session out, then signs in and keeps the account', async () => {
    const w = mount(AccountDelete, { propsData: { linkTo: () => '/account/privacy' }, stubs, attachTo: document.body })
    await tid(w, 'delete-open').trigger('click'); await tid(w, 'delete-continue').trigger('click'); await tid(w, 'delete-passkey').trigger('click'); await settle()
    const deletes = console.calls.filter(c => c.method === 'DELETE' && c.path === '/v1/me')
    expect(deletes).toHaveLength(1); expect(deletes[0].body).toEqual({}); expect(console.sessions).toHaveLength(0)
    expect(w.find('.dialog h2').text()).toContain('Your account will be deleted on')
    localStorage.setItem(TOKEN_KEY, 'token-jack-2'); console.tokens.set('token-jack-2', 'a1'); await loadMe()
    const banner = mount(DeletionBanner, { stubs }); await settle(); expect(banner.text()).toContain('Your account will be deleted on')
    await tid(banner, 'deletion-keep').trigger('click'); await settle()
    expect(console.account.deletion).toBeNull(); expect(deletionState.deleteAfter).toBeNull(); expect(banner.vm.$data.error).toBe('')
  })

  it('cancels a deletion passkey without sending or changing state', async () => {
    passkey.cancelled = true
    const w = mount(AccountDelete, { propsData: { linkTo: () => '/' }, stubs, attachTo: document.body })
    await tid(w, 'delete-open').trigger('click'); await tid(w, 'delete-continue').trigger('click'); await tid(w, 'delete-passkey').trigger('click'); await settle()
    expect(console.calls.some(c => c.method === 'DELETE' && c.path === '/v1/me')).toBe(false); expect(console.account.deletion).toBeNull()
    expect(w.text()).toContain('Passkey confirmation was cancelled. Your account is unchanged.')
  })

  it('stops when another tab changes the session during the passkey ceremony', async () => {
    passkey.pending = true
    const w = mount(AccountDelete, { propsData: { linkTo: () => '/' }, stubs, attachTo: document.body })
    await tid(w, 'delete-open').trigger('click'); await tid(w, 'delete-continue').trigger('click'); await tid(w, 'delete-passkey').trigger('click'); await settle()
    localStorage.setItem(TOKEN_KEY, 'token-someone-else'); passkey.release?.(); await settle()
    expect(console.calls.some(c => c.method === 'DELETE' && c.path === '/v1/me')).toBe(false); expect(console.account.deletion).toBeNull()
    expect(w.text()).toContain('The account changed. Open this action again.')
  })

  it('does not retry or claim success when deletion answers 401', async () => {
    console.delete401 = true
    const w = mount(AccountDelete, { propsData: { linkTo: () => '/' }, stubs, attachTo: document.body })
    await tid(w, 'delete-open').trigger('click'); await tid(w, 'delete-continue').trigger('click'); await tid(w, 'delete-passkey').trigger('click'); await settle()
    expect(console.calls.filter(c => c.method === 'DELETE' && c.path === '/v1/me')).toHaveLength(1)
    expect(tid(w, 'delete-done').exists()).toBe(false); expect(w.text()).toContain('Your session ended; sign in and try again.')
  })

  it('menu sign-out is one click and never opens the choice page', async () => {
    const vm = shallowMount(CloudAccountMenu, {
      mocks: { $store: { state: { socket: {}, config: {} }, getters: { 'auth/getCurrentUser': null, 'config/getInstances': [], 'config/getDisplayName': 'Printer' }, dispatch: vi.fn() } },
      stubs: { 'v-menu': { template: '<div><slot/><slot name="activator" :on="{}" :attrs="{}"/></div>' }, AppBtn: true }
    })
    await tid(vm, 'account-sign-out').trigger('click'); await settle()
    expect(beginSignOut).toHaveBeenCalledOnce(); expect(vm.text()).not.toContain('Sign out of this browser')
  })

  it('changes a password after passkey confirmation, while cancellation claims no success', async () => {
    const open = () => mount(AccountSecurity, { propsData: { linkTo: () => '/' }, stubs: { ...stubs, AppQrCode: true }, attachTo: document.body })
    const w = open(); await settle(); await tid(w, 'security-change-password').trigger('click')
    await w.find('input[aria-label="New password"]').setValue('new password'); await w.find('.dialog .cbtn--primary').trigger('click'); await settle()
    expect((w.vm as unknown as { reauthPasskey: unknown }).reauthPasskey).toBeTypeOf('function')
    await (w.vm as unknown as { reauthPasskey: () => Promise<void> }).reauthPasskey(); await settle()
    expect(console.password).toBe('new password'); expect(w.text()).toContain('Your password is changed.')
    passkey.cancelled = true; const cancelled = open(); await settle(); await tid(cancelled, 'security-change-password').trigger('click')
    await cancelled.find('input[aria-label="New password"]').setValue('never applied'); await cancelled.find('.dialog .cbtn--primary').trigger('click'); await settle()
    await (cancelled.vm as unknown as { reauthPasskey: () => Promise<void> }).reauthPasskey(); await settle()
    expect(console.password).toBe('new password'); expect(cancelled.text()).not.toContain('Your password is changed.')
    expect(cancelled.text()).toContain('Passkey confirmation cancelled. No action was sent.')
  })
})
