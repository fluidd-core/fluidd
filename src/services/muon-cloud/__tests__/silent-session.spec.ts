/**
 * @vitest-environment-options { "url": "https://app.muon3d.com/" }
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkCentralSession, prepareAuthorize, signOutCentral } from '../centralLogin'
import { storedToken, storedRefreshToken } from '../api'
import { challengeFor } from '../pkce'

const ORIGIN = 'https://app.muon3d.com'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  window.history.replaceState(null, '', '/fleet?sort=name#card')
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
  document.querySelectorAll('form').forEach(form => form.remove())
})

// Model the browser's followed 303. No response body is read or executed.
function answer (request: string, query: string, status = 200) {
  const state = new URL(request).searchParams.get('state')!
  return {
    ok: status === 200,
    redirected: true,
    url: `${ORIGIN}/?state=${state}&iss=${encodeURIComponent(ORIGIN)}&${query}`,
    body: { cancel: vi.fn(async () => {}) }
  } as unknown as Response
}

describe('silent browser session check', () => {
  it('shows signed out without navigating, changing history, or leaving a pending callback', async () => {
    const replace = vi.spyOn(window.history, 'replaceState')
    const fetch = vi.fn(async (url: string) => answer(url, 'error=login_required'))
    vi.stubGlobal('fetch', fetch)
    await checkCentralSession()
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(new URL(url).pathname).toBe('/authorize')
    expect(new URL(url).searchParams.get('prompt')).toBe('none')
    expect(init).toMatchObject({ credentials: 'same-origin', mode: 'same-origin', redirect: 'follow', cache: 'no-store', referrerPolicy: 'no-referrer' })
    expect(window.location.href).toBe(`${ORIGIN}/fleet?sort=name#card`)
    expect(replace).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('muon.cloud.authorize')).toBeNull()
    expect(storedToken()).toBeNull()
    await checkCentralSession()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('exchanges a code using the matching PKCE verifier and stores both tokens without a navigation', async () => {
    let authorize!: URL
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (new URL(url).pathname === '/authorize') {
        authorize = new URL(url)
        return answer(url, 'code=test-code')
      }
      expect(url).toBe(`${ORIGIN}/token`)
      const body = new URLSearchParams(String(init?.body))
      expect(body.get('code')).toBe('test-code')
      expect(body.get('redirect_uri')).toBe(`${ORIGIN}/`)
      expect(body.get('client_id')).toBe('fluidd')
      expect(body.get('grant_type')).toBe('authorization_code')
      expect(await challengeFor(body.get('code_verifier')!)).toBe(authorize.searchParams.get('code_challenge'))
      return new Response(JSON.stringify({ access_token: 'test-access', refresh_token: 'test-refresh', token_type: 'Bearer', expires_in: 900 }))
    })
    vi.stubGlobal('fetch', fetch)
    await checkCentralSession()
    expect(storedToken()).toBe('test-access')
    expect(storedRefreshToken()).toBe('test-refresh')
    expect(window.location.href).toBe(`${ORIGIN}/fleet?sort=name#card`)
    expect(sessionStorage.getItem('muon.cloud.authorize')).toBeNull()
  })

  it.each([
    'https://evil.example/?code=test-code',
    `${ORIGIN}/sign-in?code=test-code`,
    `${ORIGIN}/?code=test-code&state=forged&iss=${encodeURIComponent(ORIGIN)}`,
    `${ORIGIN}/?code=test-code&state=STATE&iss=https%3A%2F%2Fevil.example`,
    `${ORIGIN}/?code=test-code&state=STATE`,
    `${ORIGIN}/?code=test-code&state=STATE&iss=${encodeURIComponent(ORIGIN)}&error=login_required`,
    `${ORIGIN}/?code=test-code&state=STATE&state=forged&iss=${encodeURIComponent(ORIGIN)}`
  ])('refuses an unexpected final URL without sending a token request (%s)', async (finalUrl) => {
    const fetch = vi.fn(async (url: string) => ({ ...answer(url, ''), url: finalUrl.replace('STATE', new URL(url).searchParams.get('state')!) }))
    vi.stubGlobal('fetch', fetch)
    await checkCentralSession()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(storedToken()).toBeNull()
  })

  it('does not send a code or verifier to a console configured while the request was in flight', async () => {
    const fetch = vi.fn(async (url: string) => {
      localStorage.setItem('muon.cloud.url', 'https://evil.example')
      return answer(url, 'code=test-code')
    })
    vi.stubGlobal('fetch', fetch)
    await checkCentralSession()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(storedToken()).toBeNull()
  })

  it('discards tokens that arrive after sign-out during the exchange', async () => {
    let finish!: (response: Response) => void
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (new URL(url).pathname === '/authorize') return answer(url, 'code=test-code')
      return new Promise<Response>(resolve => { finish = resolve })
    }))
    const checking = checkCentralSession()
    await vi.waitFor(() => expect(finish).toBeDefined())
    vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})
    signOutCentral()
    finish(new Response(JSON.stringify({ access_token: 'test-access', refresh_token: 'test-refresh', token_type: 'Bearer', expires_in: 900 })))
    await checking
    expect(storedToken()).toBeNull()
    expect(storedRefreshToken()).toBeNull()
  })

  it.each(['/setup', '/sign-in', '/?code=invite', '/?code=callback&state=s'])('does not check on %s', async (path) => {
    window.history.replaceState(null, '', path)
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    await checkCentralSession()
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each(['network', 'http', 'not-redirected'])('keeps the page usable on %s failure', async (failure) => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (failure === 'network') throw new Error('offline')
      return { ...answer(url, 'code=test-code', failure === 'http' ? 503 : 200), redirected: failure !== 'not-redirected' }
    }))
    await expect(checkCentralSession()).resolves.toBeUndefined()
    expect(storedToken()).toBeNull()
    expect(window.location.pathname).toBe('/fleet')
  })

  it('aborts a stalled check after five seconds', async () => {
    vi.useFakeTimers()
    let signal!: AbortSignal
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      signal = init.signal!
      return new Promise<Response>((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))))
    }))
    const checking = checkCentralSession()
    await vi.waitFor(() => expect(signal).toBeDefined())
    await vi.advanceTimersByTimeAsync(5000)
    await checking
    expect(signal.aborted).toBe(true)
    expect(storedToken()).toBeNull()
  })

  it.each(['explicit sign-in', 'sign-out'])('discards a late check after %s', async (action) => {
    let finish!: (response: Response) => void
    let request!: string
    const fetch = vi.fn(async (url: string) => {
      request = url
      return new Promise<Response>(resolve => { finish = resolve })
    })
    vi.stubGlobal('fetch', fetch)
    const checking = checkCentralSession()
    await vi.waitFor(() => expect(finish).toBeDefined())
    if (action === 'explicit sign-in') await prepareAuthorize({ silent: false })
    else {
      vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})
      signOutCentral()
    }
    finish(answer(request, 'code=test-code'))
    await checking
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(storedToken()).toBeNull()
  })
})
