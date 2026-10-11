/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { base64url, challengeFor, newState, newVerifier } from '../pkce'
import {
  authorizeUrl,
  centralLoginEnabled,
  handoffUrl,
  prepareAuthorize,
  safeContinue,
  safeReturnTo,
  shouldTrySilentSignIn,
  startCentralSignIn,
  takeCallback
} from '../centralLogin'
import { cloudApi, refreshSession, storedRefreshToken, storedToken, storeRefreshToken, storeToken } from '../api'

const CONSOLE = 'https://control.muon3d.com'

function at (search: string, pathname = '/') {
  return { origin: CONSOLE, protocol: 'https:', hostname: 'control.muon3d.com', search, pathname }
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('PKCE (RFC 7636, S256)', () => {
  it('derives the challenge of the RFC\'s own example', async () => {
    // RFC 7636 Appendix B.
    await expect(challengeFor('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'))
      .resolves.toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
  })

  it('makes a 43-character verifier from the unreserved alphabet, new each time', () => {
    const a = newVerifier()
    expect(a).toMatch(/^[A-Za-z0-9\-._~]{43}$/)
    expect(newVerifier()).not.toBe(a)
    expect(newState()).not.toBe(newState())
  })

  it('encodes base64url without padding', () => {
    expect(base64url(new Uint8Array([0xfb, 0xff]))).toBe('-_8')
  })
})

describe('/authorize', () => {
  it('asks for a code with an S256 challenge, and prompt=none only when silent', () => {
    const quiet = new URL(authorizeUrl(CONSOLE, { redirectUri: `${CONSOLE}/`, challenge: 'C', state: 'S', silent: true }))
    expect(quiet.origin + quiet.pathname).toBe(`${CONSOLE}/authorize`)
    expect(Object.fromEntries(quiet.searchParams)).toEqual({
      response_type: 'code',
      client_id: 'fluidd',
      redirect_uri: `${CONSOLE}/`,
      code_challenge: 'C',
      code_challenge_method: 'S256',
      state: 'S',
      prompt: 'none'
    })
    const loud = new URL(authorizeUrl(CONSOLE, { redirectUri: `${CONSOLE}/`, challenge: 'C', state: 'S', silent: false }))
    expect(loud.searchParams.has('prompt')).toBe(false)
  })

  it('remembers a verifier whose S256 challenge is the one it sends', async () => {
    const go = vi.fn()
    await startCentralSignIn({ silent: false, returnTo: '/join?code=ABC' }, go)
    const url = new URL(go.mock.calls[0][0])
    const pending = JSON.parse(sessionStorage.getItem('muon.cloud.authorize')!)
    expect(url.searchParams.get('code_challenge')).toBe(await challengeFor(pending.verifier))
    expect(url.searchParams.get('state')).toBe(pending.state)
    expect(pending.returnTo).toBe('/join?code=ABC')
  })

  it('applies only where the console serves this page', () => {
    expect(centralLoginEnabled(at(''))).toBe(true)
    expect(centralLoginEnabled({ origin: 'http://192.168.1.37', protocol: 'http:', hostname: '192.168.1.37' })).toBe(false)
    localStorage.setItem('muon.cloud.url', 'https://elsewhere.example')
    expect(centralLoginEnabled(at(''))).toBe(false)
  })
})

describe('the silent first try (prompt=none)', () => {
  it('is tried with no session, once per tab', async () => {
    expect(shouldTrySilentSignIn(at(''))).toBe(true)
    await startCentralSignIn({ silent: true }, vi.fn())
    expect(shouldTrySilentSignIn(at(''))).toBe(false)
  })

  it('is not tried with a session, on a return from /authorize, or on the sign-in or setup page', () => {
    expect(shouldTrySilentSignIn(at('?code=x&state=y'))).toBe(false)
    expect(shouldTrySilentSignIn(at('?error=login_required&state=y'))).toBe(false)
    expect(shouldTrySilentSignIn(at('?continue=%2Fauthorize%3Fx', '/sign-in'))).toBe(false)
    expect(shouldTrySilentSignIn(at('', '/setup'))).toBe(false)
    expect(shouldTrySilentSignIn(at('?code=ABCDEFGHJK', '/join'))).toBe(false)
    expect(shouldTrySilentSignIn(at('', '/join'))).toBe(true)
    expect(shouldTrySilentSignIn(at('', '/setup-guide'))).toBe(true)
    storeToken('t')
    expect(shouldTrySilentSignIn(at(''))).toBe(false)
  })
})

describe('the return from /authorize', () => {
  async function begin (silent: boolean, returnTo = '/boxwood-367a/jobs') {
    await startCentralSignIn({ silent, returnTo }, vi.fn())
    return JSON.parse(sessionStorage.getItem('muon.cloud.authorize')!)
  }

  it('hands over the code with the verifier it was started with', async () => {
    const pending = await begin(false)
    expect(takeCallback({ search: `?code=c0de&state=${pending.state}&iss=${encodeURIComponent(CONSOLE)}` }, CONSOLE))
      .toEqual({ outcome: 'code', code: 'c0de', verifier: pending.verifier, returnTo: '/boxwood-367a/jobs' })
  })

  it('refuses a state it did not send, and a code from another issuer', async () => {
    let pending = await begin(false)
    expect(takeCallback({ search: '?code=c0de&state=forged' }, CONSOLE).outcome).toBe('error')
    pending = await begin(false)
    expect(takeCallback({ search: `?code=c0de&state=${pending.state}&iss=https%3A%2F%2Fevil.example` }, CONSOLE).outcome).toBe('error')
  })

  it('spends the verifier: the same return a second time is refused', async () => {
    const pending = await begin(false)
    const search = `?code=c0de&state=${pending.state}&iss=${encodeURIComponent(CONSOLE)}`
    expect(takeCallback({ search }, CONSOLE).outcome).toBe('code')
    expect(takeCallback({ search }, CONSOLE).outcome).toBe('error')
  })

  it('reads login_required after prompt=none as signed out, and as an error otherwise', async () => {
    let pending = await begin(true, '/join?code=ABCDEFGHJK')
    expect(takeCallback({ search: `?error=login_required&state=${pending.state}&iss=${encodeURIComponent(CONSOLE)}` }, CONSOLE))
      .toEqual({ outcome: 'signed_out', returnTo: '/join?code=ABCDEFGHJK' })
    pending = await begin(false)
    expect(takeCallback({ search: `?error=login_required&state=${pending.state}&iss=${encodeURIComponent(CONSOLE)}&error_description=Sign+in` }, CONSOLE))
      .toMatchObject({ outcome: 'error', message: 'Sign in' })
  })

  it('is nothing when the address carries no answer', () => {
    expect(takeCallback({ search: '' }, CONSOLE)).toEqual({ outcome: 'none' })
  })

  it("leaves a page's own code alone: an invite or a link code has no state", async () => {
    const pending = await begin(false)
    expect(takeCallback({ search: '?code=482913' }, CONSOLE)).toEqual({ outcome: 'none' })
    // The sign-in in flight is still there to be finished.
    expect(takeCallback({ search: `?code=c0de&state=${pending.state}&iss=${encodeURIComponent(CONSOLE)}` }, CONSOLE).outcome).toBe('code')
  })

  it('requires the issuer that the central login sends', async () => {
    await startCentralSignIn({ silent: false }, vi.fn())
    const pending = JSON.parse(sessionStorage.getItem('muon.cloud.authorize')!)
    expect(takeCallback({ search: `?code=code&state=${pending.state}` }, CONSOLE).outcome).toBe('error')
  })

  it('only ever returns to an address on this page', () => {
    expect(safeReturnTo('/join?code=X')).toBe('/join?code=X')
    expect(safeReturnTo('/settings#access')).toBe('/settings#access')
    for (const bad of ['', '#', 'join', 'https://evil.example/', '//evil.example', '/\\evil', '/a b', '#//evil.example', '#/a b', '#/\\evil']) {
      expect(safeReturnTo(bad)).toBe('/')
    }
  })

  it('takes a hash route that a tab remembers from an older Fluidd as its path', async () => {
    expect(safeReturnTo('#/join?code=X')).toBe('/join?code=X')
    // A tab that left for /authorize on the hash-routed Fluidd comes back to this one.
    sessionStorage.setItem('muon.cloud.authorize', JSON.stringify({ state: 'S', verifier: 'V', returnTo: '#/fleet', silent: false }))
    expect(takeCallback({ search: `?code=c0de&state=S&iss=${encodeURIComponent(CONSOLE)}` }, CONSOLE))
      .toEqual({ outcome: 'code', code: 'c0de', verifier: 'V', returnTo: '/fleet' })
  })

  it('puts the address back to the path the trip started from', async () => {
    const pending = await begin(false, '/boxwood-367a/jobs?sort=name')
    window.history.replaceState(null, '', `/?code=c0de&state=${pending.state}`)
    takeCallback({ search: `?code=c0de&state=${pending.state}&iss=${encodeURIComponent(CONSOLE)}` }, CONSOLE)
    expect(`${window.location.pathname}${window.location.search}`).toBe('/boxwood-367a/jobs?sort=name')
  })

  it('starts from where the page is now when told nothing else', async () => {
    window.history.replaceState(null, '', '/join?code=ABC#x')
    await startCentralSignIn({ silent: true }, vi.fn())
    expect(JSON.parse(sessionStorage.getItem('muon.cloud.authorize')!).returnTo).toBe('/join?code=ABC#x')
    window.history.replaceState(null, '', '/')
  })
})

describe('the sign-in page\'s continue', () => {
  it('follows only a path beginning /authorize?', () => {
    expect(safeContinue('/authorize?response_type=code&client_id=slicer')).toBe('/authorize?response_type=code&client_id=slicer')
    for (const bad of [
      undefined, null, 42, ['/authorize?x'], '',
      '/authorize', '/authorize/x?y', '/authorizex?y', 'authorize?x', ' /authorize?x',
      '//evil.example/authorize?x', 'https://evil.example/authorize?x', '/\\evil.example/authorize?x',
      '/authorize?x\\y', '/authorize?a b', '/authorize?a\nb', '/authorize?a\tb',
      'javascript:alert(1)//authorize?'
    ]) {
      expect(safeContinue(bad)).toBeNull()
    }
  })

  it('carries continue on to /handoff as next, and the console root without one', () => {
    const url = new URL(handoffUrl(`${CONSOLE}/handoff?code=h4nd`, '/authorize?client_id=slicer&state=s'))
    expect(url.origin + url.pathname).toBe(`${CONSOLE}/handoff`)
    expect(url.searchParams.get('code')).toBe('h4nd')
    expect(url.searchParams.get('next')).toBe('/authorize?client_id=slicer&state=s')
    expect(new URL(handoffUrl(`${CONSOLE}/handoff?code=h4nd`, null)).searchParams.get('next')).toBe('/')
  })

  it('with no continue, asks /authorize for this page itself', async () => {
    const url = new URL(await prepareAuthorize({ silent: false, returnTo: '/' }))
    expect(url.pathname).toBe('/authorize')
    expect(url.searchParams.get('redirect_uri')).toBe(`${CONSOLE}/`)
    expect(safeContinue(`${url.pathname}${url.search}`)).not.toBeNull()
  })
})

describe('/token', () => {
  function stubFetch (...answers: Array<{ status: number, body: unknown }>) {
    const fetch = vi.fn<[string, RequestInit], Promise<Response>>(async () => {
      const answer = answers.shift()!
      return new Response(JSON.stringify(answer.body), { status: answer.status })
    })
    vi.stubGlobal('fetch', fetch)
    return fetch
  }

  it('exchanges the code, form-encoded, with the verifier and the redirect URI', async () => {
    const fetch = stubFetch({ status: 200, body: { access_token: 'a', refresh_token: 'r', token_type: 'Bearer', expires_in: 900 } })
    await expect(cloudApi.exchangeCode('c0de', `${CONSOLE}/`, 'v3rifier')).resolves.toMatchObject({ access_token: 'a' })
    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe(`${CONSOLE}/token`)
    expect(init.headers).toEqual({ 'content-type': 'application/x-www-form-urlencoded' })
    expect(Object.fromEntries(new URLSearchParams(String(init.body)))).toEqual({
      grant_type: 'authorization_code',
      code: 'c0de',
      redirect_uri: `${CONSOLE}/`,
      client_id: 'fluidd',
      code_verifier: 'v3rifier'
    })
  })

  it('reports OAuth\'s error shape', async () => {
    stubFetch({ status: 400, body: { error: 'invalid_grant', error_description: 'The code was used.' } })
    await expect(cloudApi.exchangeCode('c0de', `${CONSOLE}/`, 'v')).rejects.toMatchObject({ message: 'The code was used.', status: 400, code: 'invalid_grant' })
  })

  it('refreshes once on a 401, for two requests at the same time, and retries', async () => {
    storeToken('old')
    storeRefreshToken('r1')
    const fetch = vi.fn<[string, RequestInit], Promise<Response>>(async (url, init) => {
      if (url.endsWith('/token')) return new Response(JSON.stringify({ access_token: 'new', refresh_token: 'r2', token_type: 'Bearer', expires_in: 900 }), { status: 200 })
      const auth = (init.headers as Record<string, string>).authorization
      return auth === 'Bearer new'
        ? new Response(JSON.stringify({ printers: [] }), { status: 200 })
        : new Response(JSON.stringify({ error: 'expired' }), { status: 401 })
    })
    vi.stubGlobal('fetch', fetch)

    await Promise.all([cloudApi.printers(), cloudApi.printers()])

    const refreshes = fetch.mock.calls.filter(([url]) => url.endsWith('/token'))
    expect(refreshes).toHaveLength(1)
    expect(Object.fromEntries(new URLSearchParams(String(refreshes[0][1].body)))).toEqual({
      grant_type: 'refresh_token', refresh_token: 'r1', client_id: 'fluidd'
    })
    expect(storedToken()).toBe('new')
    expect(storedRefreshToken()).toBe('r2')
  })

  it('drops both tokens when the refresh is refused', async () => {
    storeToken('old')
    storeRefreshToken('r1')
    stubFetch({ status: 400, body: { error: 'invalid_grant' } })
    await expect(refreshSession()).resolves.toBe(false)
    expect(storedToken()).toBeNull()
    expect(storedRefreshToken()).toBeNull()
  })

  it('retries a late 401 with the pair already refreshed by another request', async () => {
    storeToken('old')
    storeRefreshToken('r1')
    let answerLate!: (response: Response) => void
    let oldRequests = 0
    const fetch = vi.fn<[string, RequestInit], Promise<Response>>(async (url, init) => {
      if (url.endsWith('/token')) return new Response(JSON.stringify({ access_token: 'new', refresh_token: 'r2', token_type: 'Bearer', expires_in: 900 }))
      if ((init.headers as Record<string, string>).authorization === 'Bearer new') return new Response(JSON.stringify({ printers: [] }))
      if (++oldRequests === 1) return new Promise(resolve => { answerLate = resolve })
      return new Response(JSON.stringify({ error: 'expired' }), { status: 401 })
    })
    vi.stubGlobal('fetch', fetch)
    const late = cloudApi.printers()
    await cloudApi.printers()
    answerLate(new Response(JSON.stringify({ error: 'expired' }), { status: 401 }))
    await expect(late).resolves.toEqual({ printers: [] })
    expect(fetch.mock.calls.filter(([url]) => url.endsWith('/token'))).toHaveLength(1)
  })
})
