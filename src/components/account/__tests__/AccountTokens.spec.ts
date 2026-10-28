import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AccountTokens from '../AccountTokens.vue'
import { accountState } from '@/services/account/state'
import { AccountError } from '@/services/account/client'
import type { CreatedToken, PersonalToken } from '@/services/account/tokens'
import { cloudState } from '@/services/muon-cloud/state'

const tokens = vi.hoisted(() => vi.fn())
const createToken = vi.hoisted(() => vi.fn())
const revokeToken = vi.hoisted(() => vi.fn(async () => ({ id: 't1', revoked: true })))
vi.mock('@/services/account/api', async (actual) => ({
  ...(await actual() as object),
  accountApi: { tokens, createToken, revokeToken }
}))
vi.mock('@/services/account/state', async (actual) => ({
  ...(await actual() as object),
  loadMe: async () => undefined
}))

const NOW = Math.floor(Date.now() / 1000)
const SECRET = 'mpat_' + 'x'.repeat(43)

function token (extra: Partial<PersonalToken> = {}): PersonalToken {
  return { id: 't1', name: 'Laptop scripts', prefix: 'mpat_Ab3', scopes: ['printers:read'], printer_ids: null, ask_mode: 'ask', expires_at: NOW + 86400 * 30, created_at: NOW - 60, last_used_at: null, status: 'active', ...extra }
}

const settle = () => new Promise(resolve => setTimeout(resolve))

function open (confirm = true) {
  const $confirm = vi.fn(async () => confirm)
  const w = mount(AccountTokens, {
    mocks: { $confirm },
    stubs: { 'frame-icon': true, 'router-link': { template: '<a><slot /></a>' }, 'reauth-dialog': true }
  })
  return { w, $confirm }
}

async function startForm (w: ReturnType<typeof open>['w'], name = 'x') {
  await settle()
  await w.find('[data-tid="tokens-make-empty"]').trigger('click')
  await w.find('[data-tid="tokens-name"]').setValue(name)
}

describe('Access tokens', () => {
  beforeEach(() => {
    accountState.me = { account: { id: 'a', email: 'a@b.c', name: 'A', created_at: 0, two_step: true } } as never
    cloudState.printers = [
      { id: 'p1', name: 'Boxwood', model: 'M1', version: '', linked_at: 0, last_seen: 0, online: true, online_since: null },
      { id: 'p2', name: 'Shared one', model: 'M1', version: '', linked_at: 0, last_seen: 0, online: true, online_since: null, shared: true }
    ]
    tokens.mockResolvedValue({ tokens: [] })
  })
  afterEach(() => {
    vi.clearAllMocks()
    accountState.me = null
    cloudState.printers = []
  })

  it('shows the empty state with a way to make one', async () => {
    const { w } = open()
    await settle()
    expect(w.find('[data-tid="tokens-empty"]').exists()).toBe(true)
    expect(w.text()).toContain('No tokens yet')
  })

  it('says it comes soon on a console without the routes', async () => {
    tokens.mockRejectedValueOnce(new AccountError('Not found.', 404, {}))
    const { w } = open()
    await settle()
    expect(w.find('[data-tid="tokens-missing"]').exists()).toBe(true)
    expect(w.find('[data-tid="tokens-make"]').exists()).toBe(false)
  })

  it('lists a token with its prefix, mode, printers and use, and revokes it after a confirm', async () => {
    tokens.mockResolvedValue({ tokens: [token({ printer_ids: ['p1'], last_used_at: NOW - 600 })] })
    const { w, $confirm } = open()
    await settle()
    const text = w.find('[data-tid="tokens-list"]').text()
    expect(text).toContain('Laptop scripts')
    expect(text).toContain('mpat_Ab3')
    expect(text).toContain('Boxwood')
    expect(text).toContain('Ask mode')
    expect(text).toContain('Used 10 minutes ago')
    await w.find('[data-tid="tokens-revoke"]').trigger('click')
    await settle()
    expect($confirm).toHaveBeenCalled()
    expect(revokeToken).toHaveBeenCalledWith('t1')
  })

  it('does not revoke when the confirm is declined, and has no button on ended tokens', async () => {
    tokens.mockResolvedValue({ tokens: [token(), token({ id: 't2', status: 'revoked' })] })
    const { w } = open(false)
    await settle()
    expect(w.findAll('[data-tid="tokens-revoke"]')).toHaveLength(1)
    await w.find('[data-tid="tokens-revoke"]').trigger('click')
    await settle()
    expect(revokeToken).not.toHaveBeenCalled()
  })

  it('makes a token with the defaults: Ask, 30 days, all printers, printers:read', async () => {
    createToken.mockResolvedValue({ ...token(), token: SECRET } as CreatedToken)
    const { w } = open()
    await settle()
    await w.find('[data-tid="tokens-make-empty"]').trigger('click')
    expect(w.find('[data-tid="tokens-create"]').attributes('disabled')).toBeTruthy()
    await w.find('[data-tid="tokens-name"]').setValue('Laptop scripts')
    await w.find('[data-tid="tokens-create"]').trigger('click')
    await settle()
    expect(createToken).toHaveBeenCalledTimes(1)
    expect(createToken.mock.calls[0][0]).toEqual({ name: 'Laptop scripts', scopes: ['printers:read'], expires_in_days: 30, ask_mode: 'ask' })
    expect((w.find('[data-tid="tokens-secret"]').element as HTMLInputElement).value).toBe(SECRET)
    expect(w.text()).toContain("You won't see it again")
  })

  it('shows the token once: gone after the person has saved it, and never in storage', async () => {
    createToken.mockResolvedValue({ ...token(), token: SECRET } as CreatedToken)
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const { w } = open()
    await startForm(w)
    await w.find('[data-tid="tokens-create"]').trigger('click')
    await settle()
    expect((w.find('[data-tid="tokens-secret"]').element as HTMLInputElement).value).toBe(SECRET)
    await w.find('[data-tid="tokens-done"]').trigger('click')
    expect(w.find('[data-tid="tokens-secret"]').exists()).toBe(false)
    expect(w.html()).not.toContain(SECRET)
    expect(JSON.stringify(accountState)).not.toContain(SECRET)
    expect(setItem.mock.calls.some(call => String(call[1]).includes(SECRET))).toBe(false)
    setItem.mockRestore()
  })

  it('copies the token', async () => {
    createToken.mockResolvedValue({ ...token(), token: SECRET } as CreatedToken)
    const writeText = vi.fn(async () => undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const { w } = open()
    await startForm(w)
    await w.find('[data-tid="tokens-create"]').trigger('click')
    await settle()
    await w.find('[data-tid="tokens-copy"]').trigger('click')
    await settle()
    expect(writeText).toHaveBeenCalledWith(SECRET)
    expect(w.find('[data-tid="tokens-copy"]').text()).toContain('Copied')
  })

  it('sends only the chosen printers, and will not make one with none chosen', async () => {
    createToken.mockResolvedValue({ ...token(), token: SECRET } as CreatedToken)
    const { w } = open()
    await startForm(w)
    await w.find('[data-tid="tokens-printers-some"]').setChecked(true)
    expect(w.find('[data-tid="tokens-create"]').attributes('disabled')).toBeTruthy()
    expect(w.find('[data-tid="tokens-printer-p2"]').exists()).toBe(false)
    await w.find('[data-tid="tokens-printer-p1"]').setChecked(true)
    await w.find('[data-tid="tokens-create"]').trigger('click')
    await settle()
    expect(createToken.mock.calls[0][0].printer_ids).toEqual(['p1'])
  })

  it('warns about Bypass, and blocks it without two-step sign-in', async () => {
    accountState.me = { account: { id: 'a', email: 'a@b.c', name: 'A', created_at: 0, two_step: false } } as never
    const { w } = open()
    await startForm(w)
    await w.setData({ bypassSoon: false })
    expect(w.find('[data-tid="tokens-bypass-warning"]').exists()).toBe(false)
    await w.find('[data-tid="tokens-mode-bypass"]').setChecked(true)
    expect(w.find('[data-tid="tokens-bypass-warning"]').text()).toContain('without your click')
    expect(w.find('[data-tid="tokens-needs-two-step"]').exists()).toBe(true)
    expect(w.find('[data-tid="tokens-create"]').attributes('disabled')).toBeTruthy()
  })

  it('sends Bypass for 8 hours by default when two-step is on', async () => {
    createToken.mockResolvedValue({ ...token({ ask_mode: 'bypass' }), token: SECRET } as CreatedToken)
    const { w } = open()
    await startForm(w)
    await w.setData({ bypassSoon: false })
    await w.find('[data-tid="tokens-mode-bypass"]').setChecked(true)
    await w.find('[data-tid="tokens-create"]').trigger('click')
    await settle()
    expect(createToken.mock.calls[0][0]).toMatchObject({ ask_mode: 'bypass', bypass_hours: 8 })
  })

  it('says why on a 429, and keeps the form open', async () => {
    createToken.mockRejectedValue(new AccountError('slow down', 429, { code: 'rate_limited' }))
    const { w } = open()
    await startForm(w)
    await w.find('[data-tid="tokens-create"]').trigger('click')
    await settle()
    expect(w.find('[data-tid="tokens-form-error"]').text()).toMatch(/wait a few minutes/i)
    expect(w.find('[data-tid="tokens-form"]').exists()).toBe(true)
  })

  it('says why on 403 interactive_only', async () => {
    createToken.mockRejectedValue(new AccountError('no', 403, { code: 'interactive_only' }))
    const { w } = open()
    await startForm(w)
    await w.find('[data-tid="tokens-create"]').trigger('click')
    await settle()
    expect(w.find('[data-tid="tokens-form-error"]').text()).toContain('signed-in browser')
  })

  it('shows Bypass and Heat/move as Coming soon, disabled, with no promise nobody keeps', async () => {
    const { w } = open()
    await startForm(w)
    expect(w.find('[data-tid="tokens-soon-bypass"]').text()).toBe('Coming soon')
    expect(w.find('[data-tid="tokens-mode-bypass"]').attributes('disabled')).toBeTruthy()
    expect(w.find('[data-tid="tokens-soon-printers:control"]').text()).toBe('Coming soon')
    expect(w.find('[data-tid="tokens-scope-printers:control"]').attributes('disabled')).toBeTruthy()
    const text = w.find('[data-tid="tokens-form"]').text()
    expect(text).toContain('not enforced yet')
    expect(text).not.toMatch(/still needs your OK|Temperature limits|You get a prompt/)
  })

  it('files Emergency stop under Make changes, not Look only', async () => {
    const { w } = open()
    await startForm(w)
    expect(w.find('[data-tid="tokens-group-read"] [data-tid="tokens-scope-printers:estop"]').exists()).toBe(false)
    expect(w.find('[data-tid="tokens-group-change"] [data-tid="tokens-scope-printers:estop"]').exists()).toBe(true)
    expect(w.find('[data-tid="tokens-group-change"]').text()).toContain('ends the print')
  })

  it('asks for the two-step code when the token can queue or upload', async () => {
    accountState.me = { account: { id: 'a', email: 'a@b.c', name: 'A', created_at: 0, two_step: false } } as never
    const { w } = open()
    await startForm(w)
    expect(w.find('[data-tid="tokens-needs-two-step"]').exists()).toBe(false)
    await w.find('[data-tid="tokens-scope-printers:queue"]').setChecked(true)
    expect(w.find('[data-tid="tokens-needs-two-step"]').exists()).toBe(true)
    expect(w.find('[data-tid="tokens-create"]').attributes('disabled')).toBeTruthy()
  })

  it('handles 409 not_available_yet with a plain message and stops offering the scope', async () => {
    createToken.mockRejectedValue(new AccountError('x', 409, { type: 'https://x/not_available_yet', code: 'not_available_yet' }))
    const { w } = open()
    await startForm(w)
    await w.setData({ soonScopes: [], bypassSoon: false })
    await w.find('[data-tid="tokens-scope-printers:control"]').setChecked(true)
    await w.find('[data-tid="tokens-create"]').trigger('click')
    await settle()
    expect(w.find('[data-tid="tokens-form-error"]').text()).toContain('isn\'t available yet')
    expect(w.find('[data-tid="tokens-scope-printers:control"]').attributes('disabled')).toBeTruthy()
    expect((w.find('[data-tid="tokens-scope-printers:control"]').element as HTMLInputElement).checked).toBe(false)
  })
})
