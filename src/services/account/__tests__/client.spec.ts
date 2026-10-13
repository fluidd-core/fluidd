import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { accountRequest, AccountError, isMissing, sentence } from '../client'
import { accountApi } from '../api'

const BASE = 'https://control.example.test'

function answer (status: number, body: unknown, raw = false) {
  return new Response(raw ? String(body) : JSON.stringify(body), { status, headers: { 'content-type': raw ? 'text/html' : 'application/json' } })
}

describe('the account client', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('muon.cloud.url', BASE)
    localStorage.setItem('muon.cloud.token', 'access-1')
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('sends the stored session to the console and reads the answer', async () => {
    fetchMock.mockResolvedValueOnce(answer(200, { account: { id: 'a1', name: 'Jack Smith' } }))
    const me = await accountApi.me()
    expect(me.account.name).toBe('Jack Smith')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${BASE}/v1/me`)
    expect(init.headers.authorization).toBe('Bearer access-1')
  })

  it('keeps the whole error, so a page can ask the person to confirm it is them', async () => {
    fetchMock.mockResolvedValueOnce(answer(403, { error: 'enter your password to confirm it is you', reauth_required: true }))
    const error = await accountApi.deleteAccount({}).catch(e => e)
    expect(error).toBeInstanceOf(AccountError)
    expect(error.reauthRequired).toBe(true)
    expect(error.message).toBe('Enter your password to confirm it is you.')
    expect(error.missing).toBe(false)
  })

  it('reads the two-step token off a sign-in that needs a code', async () => {
    fetchMock.mockResolvedValueOnce(answer(403, { error: 'enter the code from your authenticator app', mfa_required: true, mfa_token: 't0k' }))
    const error = await accountRequest('POST', '/v1/auth/sign-in', {}, { token: null }).catch((e: AccountError) => e) as AccountError
    expect(error.mfaToken).toBe('t0k')
  })

  it('tells a route the console does not have yet from a refusal', async () => {
    fetchMock.mockResolvedValueOnce(answer(404, '<html>Not found</html>', true))
    const missing = await accountApi.preferences().catch(e => e)
    expect(isMissing(missing)).toBe(true)

    fetchMock.mockResolvedValueOnce(answer(405, ''))
    expect(isMissing(await accountApi.endSessions('all').catch(e => e))).toBe(true)

    fetchMock.mockResolvedValueOnce(answer(404, { error: 'no such device on this account' }))
    expect(isMissing(await accountApi.endSession('x').catch(e => e))).toBe(false)
  })

  it('refreshes a central-login session once on a 401, then retries', async () => {
    localStorage.setItem('muon.cloud.refresh', 'refresh-1')
    fetchMock
      .mockResolvedValueOnce(answer(401, { error: 'sign in again' }))
      .mockResolvedValueOnce(answer(200, { access_token: 'access-2', refresh_token: 'refresh-2', token_type: 'Bearer', expires_in: 900 }))
      .mockResolvedValueOnce(answer(200, { sessions: [] }))
    expect(await accountApi.sessions()).toEqual({ sessions: [] })
    expect(fetchMock.mock.calls[1][0]).toBe(`${BASE}/token`)
    expect(fetchMock.mock.calls[2][1].headers.authorization).toBe('Bearer access-2')
  })

  it('never refreshes for a token passed in (the sign-in page\'s own)', async () => {
    localStorage.setItem('muon.cloud.refresh', 'refresh-1')
    fetchMock.mockResolvedValueOnce(answer(401, { error: 'that session has ended' }))
    const error = await accountRequest('POST', '/v1/handoff', undefined, { token: 'page-token' }).catch((e: AccountError) => e) as AccountError
    expect(error.status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('says the console could not be reached when the network fails', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const error = await accountApi.me().catch(e => e)
    expect(error.status).toBe(0)
    expect(error.message).toBe('The Muon3D service could not be reached.')
  })

  it('writes the console\'s clauses as sentences', () => {
    expect(sentence('that code is not right')).toBe('That code is not right.')
    expect(sentence('Already a sentence.')).toBe('Already a sentence.')
  })
})
