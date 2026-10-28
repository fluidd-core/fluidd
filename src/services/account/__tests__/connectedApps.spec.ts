import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountError, isMissing } from '../client'
import { accountApi } from '../api'
import {
  appFailure,
  appScopes,
  approvedText,
  lastUsedText,
  siteText,
  whereText,
  type ConnectedApp
} from '../connectedApps'

const BASE = 'https://control.example.test'

function answer (status: number, body: unknown, raw = false) {
  return new Response(raw ? String(body) : JSON.stringify(body), { status, headers: { 'content-type': raw ? 'text/html' : 'application/json' } })
}

// The console's example row (console-api contract, 27 Oct; muon-console connected_apps.rs).
const CLAUDE: ConnectedApp = {
  client_id: 'dyn_Qm9vS2V5',
  name: 'Claude',
  verified: false,
  known: true,
  redirect_hosts: ['claude.ai'],
  client_uri: 'https://claude.ai',
  logo_uri: null,
  scopes: ['printers:read', 'account:read'],
  approved_at: 1793000000,
  last_used_at: 1793050000,
  sessions: 1,
  current: false
}

describe('the connected-apps calls', () => {
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

  it('lists the apps with the signed-in session', async () => {
    fetchMock.mockResolvedValueOnce(answer(200, { apps: [CLAUDE] }))
    const { apps } = await accountApi.connectedApps()
    expect(apps).toEqual([CLAUDE])
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${BASE}/v1/me/connected-apps`)
    expect(init.method).toBe('GET')
    expect(init.headers.authorization).toBe('Bearer access-1')
    expect(init.body).toBeUndefined()
  })

  it('disconnects one by its client id, escaped into the path', async () => {
    fetchMock.mockResolvedValueOnce(answer(200, { ok: true, client_id: 'dyn_a/b c', sessions_ended: 2 }))
    const done = await accountApi.disconnectApp('dyn_a/b c')
    expect(done).toEqual({ ok: true, client_id: 'dyn_a/b c', sessions_ended: 2 })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${BASE}/v1/me/connected-apps/dyn_a%2Fb%20c`)
    expect(init.method).toBe('DELETE')
    expect(init.headers.authorization).toBe('Bearer access-1')
  })

  it('tells a console without the route from an app that is not connected', async () => {
    // A console from before muon-link-cloud #82: a bare 404, no JSON error.
    fetchMock.mockResolvedValueOnce(answer(404, '', true))
    expect(isMissing(await accountApi.connectedApps().catch(e => e))).toBe(true)

    // The route exists, but this app isn't connected (or is already gone).
    fetchMock.mockResolvedValueOnce(answer(404, { error: 'no app with that id is connected to this account' }))
    const gone = await accountApi.disconnectApp('dyn_x').catch(e => e)
    expect(isMissing(gone)).toBe(false)
    expect(appFailure(gone)).toBe('That app was already disconnected.')
  })

  it('says what each refusal from the console means', async () => {
    fetchMock.mockResolvedValueOnce(answer(409, { error: 'this is the app you are using; sign out instead', code: 'current_app' }))
    expect(appFailure(await accountApi.disconnectApp('fluidd').catch(e => e))).toBe('That is the app you are using now. To end it, sign out instead.')

    fetchMock.mockResolvedValueOnce(answer(403, { error: 'this needs a signed-in session', code: 'interactive_only' }))
    expect(appFailure(await accountApi.connectedApps().catch(e => e))).toMatch(/signed-in browser/)

    fetchMock.mockResolvedValueOnce(answer(429, { error: 'slow down' }))
    expect(appFailure(await accountApi.disconnectApp('dyn_x').catch(e => e))).toBe('That was too many tries. Wait a few minutes, then try again.')

    fetchMock.mockResolvedValueOnce(answer(500, { error: 'the store is not writable' }))
    expect(appFailure(await accountApi.disconnectApp('dyn_x').catch(e => e))).toBe('The store is not writable.')
  })

  it('says the service could not be reached when the request never arrives', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const error = await accountApi.connectedApps().catch(e => e)
    expect(error).toBeInstanceOf(AccountError)
    expect(appFailure(error)).toBe('The Muon3D service could not be reached.')
    expect(appFailure(new Error('boom'))).toBe('Something went wrong. Try again.')
  })
})

describe('connected app lines', () => {
  const NOW = 1_793_050_000_000

  it('names the site an app claims only when it is not where it signs in', () => {
    expect(siteText(CLAUDE)).toBe('')
    expect(siteText({ client_uri: 'https://example.com/app', redirect_hosts: ['127.0.0.1'] })).toBe('example.com')
    expect(siteText({ client_uri: 'not a url', redirect_hosts: [] })).toBe('')
    expect(siteText({ client_uri: null, redirect_hosts: [] })).toBe('')
  })

  it('counts websites past two instead of listing them', () => {
    expect(whereText({ redirect_hosts: ['a.example', 'b.example', 'c.example', '127.0.0.1'] })).toBe('3 websites and a program on your computer')
    expect(whereText({ redirect_hosts: ['a.example', 'b.example'] })).toBe('a.example and b.example')
  })

  it('says when an app was approved, or that there is no approval on record', () => {
    expect(approvedText({ approved_at: null }, NOW)).toBe('No approval on record')
    expect(approvedText({ approved_at: 1793000000 }, NOW)).toMatch(/^Approved \d{1,2} [A-Z][a-z]{2}$/)
  })

  it('says when an app was last used', () => {
    expect(lastUsedText({ last_used_at: 1793050000 - 600, sessions: 1 }, NOW)).toBe('Used 10 minutes ago')
    expect(lastUsedText({ last_used_at: 1793050000, sessions: 0 }, NOW)).toBe('Not signed in now')
  })

  it('words scopes as the Tokens page does, and marks the ones that act', () => {
    const scopes = appScopes({ scopes: ['printers:read', 'printers:queue', 'robot:dance'] })
    expect(scopes.map(s => s.power)).toEqual([false, true, false])
    expect(scopes[0].label).toBe('See your printers and how they\'re doing')
    // A scope the page has no words for is shown as it is.
    expect(scopes[2].label).toBe('robot:dance')
  })
})
