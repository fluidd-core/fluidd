import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { codeSignIn, finishSignIn, forgotPassword, passwordSignIn, resetPassword, signUp, verifyEmail } from '../sign-in'
import { AccountError } from '../client'

const BASE = 'https://control.example.test'

function answer (status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

describe('the console\'s sign-in page', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('muon.cloud.url', BASE)
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('sends the private declared age only to the console signup route', async () => {
    fetchMock.mockResolvedValueOnce(answer(200, { token: 'page-session' }))
    await signUp('new@example.test', 'a long password', 'Ada', 17)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ declared_age: 17 })
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/v1/auth/sign-up`)
  })

  it('asks for a session that is not kept, and sends none of its own', async () => {
    fetchMock.mockResolvedValueOnce(answer(200, { token: 'page-session', account: { id: 'a1' } }))
    expect(await passwordSignIn('jack@muon3d.com', 'correct horse')).toBe('page-session')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${BASE}/v1/auth/sign-in`)
    expect(init.headers.authorization).toBeUndefined()
    // Deliberately spell out the contract: importing SIGN_IN_DEVICE here would
    // let the test agree with a broken production constant.
    expect(JSON.parse(init.body)).toEqual({ email: 'jack@muon3d.com', password: 'correct horse', device: 'Muon3D sign-in', refresh: false })
  })

  it('hands back the two-step token when the account has two-step sign-in', async () => {
    fetchMock.mockResolvedValueOnce(answer(403, { error: 'enter the code from your authenticator app', mfa_required: true, mfa_token: 'mfa-1' }))
    const error = await passwordSignIn('jack@muon3d.com', 'correct horse').catch((e: AccountError) => e) as AccountError
    expect(error.mfaToken).toBe('mfa-1')
    fetchMock.mockResolvedValueOnce(answer(200, { token: 'page-session' }))
    expect(await codeSignIn('mfa-1', '482 913')).toBe('page-session')
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ mfa_token: 'mfa-1', code: '482913' })
  })

  it('removes every kind of whitespace from a two-step code and sends no session', async () => {
    fetchMock.mockResolvedValueOnce(answer(200, { token: 'page-session' }))
    await codeSignIn('mfa-secret', ' 48\t2\n9 13 ')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${BASE}/v1/auth/mfa`)
    expect(init.headers.authorization).toBeUndefined()
    expect(JSON.parse(init.body)).toEqual({ mfa_token: 'mfa-secret', code: '482913' })
  })

  it('uses the exact anonymous account endpoints and request bodies', async () => {
    fetchMock
      .mockResolvedValueOnce(answer(200, { token: 'new-session' }))
      .mockResolvedValueOnce(answer(200, { ok: true }))
      .mockResolvedValueOnce(answer(200, { ok: true }))
      .mockResolvedValueOnce(answer(200, { ok: true, email: 'new@example.test' }))
      .mockResolvedValueOnce(answer(200, { ok: true }))

    await expect(signUp('new@example.test', 'pw', 'New Person')).resolves.toBe('new-session')
    await forgotPassword('new@example.test')
    await resetPassword('reset-token', 'replacement')
    await expect(verifyEmail('verify-token')).resolves.toBe('new@example.test')
    await expect(verifyEmail('verify-without-email')).resolves.toBe('')

    expect(fetchMock.mock.calls.map(([url, init]) => [url, JSON.parse(init.body)])).toEqual([
      [`${BASE}/v1/auth/sign-up`, { email: 'new@example.test', password: 'pw', name: 'New Person', device: 'Muon3D sign-in', refresh: false }],
      [`${BASE}/v1/auth/password/forgot`, { email: 'new@example.test' }],
      [`${BASE}/v1/auth/password/reset`, { token: 'reset-token', password: 'replacement' }],
      [`${BASE}/v1/auth/email/verify`, { token: 'verify-token' }],
      [`${BASE}/v1/auth/email/verify`, { token: 'verify-without-email' }]
    ])
    expect(fetchMock.mock.calls.every(([, init]) => init.headers.authorization === undefined)).toBe(true)
  })

  it('ends the page\'s own session once the handoff is in hand, so it never shows in Devices', async () => {
    fetchMock
      .mockResolvedValueOnce(answer(200, { code: 'h1', url: `${BASE}/handoff?code=h1`, expires_at: 0 }))
      .mockResolvedValueOnce(answer(200, { ok: true }))
    const next = await finishSignIn('page-session', '/authorize?client_id=fluidd&state=s')
    const [handoffCall, signOutCall] = fetchMock.mock.calls
    expect(handoffCall[0]).toBe(`${BASE}/v1/handoff`)
    expect(handoffCall[1].headers.authorization).toBe('Bearer page-session')
    expect(signOutCall[0]).toBe(`${BASE}/v1/auth/sign-out`)
    expect(signOutCall[1].method).toBe('POST')
    expect(signOutCall[1].headers.authorization).toBe('Bearer page-session')
    expect(next).toContain('code=h1')
    expect(decodeURIComponent(next)).toContain('/authorize?client_id=fluidd&state=s')
  })

  it('still goes on when ending the page\'s session fails: the console ends it in 30 days', async () => {
    fetchMock
      .mockResolvedValueOnce(answer(200, { code: 'h1', url: `${BASE}/handoff?code=h1`, expires_at: 0 }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(finishSignIn('page-session', '/authorize?client_id=fluidd')).resolves.toContain('code=h1')
  })

  it('refuses a handoff URL on an attacker-controlled origin', async () => {
    fetchMock
      .mockResolvedValueOnce(answer(200, { code: 'h1', url: 'https://attacker.example/collect?code=h1', expires_at: 0 }))
      .mockResolvedValueOnce(answer(200, { ok: true }))

    await expect(finishSignIn('page-session', '/authorize?client_id=fluidd')).rejects.toThrow('wrong origin')
  })

  it('prepares a safe authorize target when no continuation was supplied', async () => {
    fetchMock
      .mockResolvedValueOnce(answer(200, { code: 'h2', url: `${BASE}/handoff?code=h2`, expires_at: 0 }))
      .mockResolvedValueOnce(answer(200, { ok: true }))
    const result = await finishSignIn('page-session', null, '/jobs')
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/v1/handoff`)
    expect(decodeURIComponent(result)).toContain('/authorize?')
    expect(JSON.parse(sessionStorage.getItem('muon.cloud.authorize') ?? '{}')).toMatchObject({ returnTo: '/jobs', silent: false })
  })
})
