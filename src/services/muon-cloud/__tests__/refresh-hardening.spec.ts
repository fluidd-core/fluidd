/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CloudError, cloudApi, REFRESH_TIMEOUT_MS, refreshSession, setSessionRecovery, storedRefreshToken, storedToken, storeRefreshToken, storeToken, withRefreshLock } from '../api'
import { recoverCentralSession, resetRecovery } from '../centralLogin'
import { cloudState, refreshPrinters } from '../state'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))

const noLocks = () => vi.stubGlobal('navigator', {})
const withLocks = () => vi.stubGlobal('navigator', { locks: { request: (_n: string, work: () => Promise<unknown>) => work() } })

function json (status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) } as Response
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  storeToken('access-0')
  storeRefreshToken('refresh-0')
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
  setSessionRecovery(null)
  resetRecovery()
  cloudState.account = null
})

describe('a refresh the console never answered', () => {
  const offline = () => vi.fn(async (url: string) => {
    if (new URL(url).pathname === '/token') throw new TypeError('offline')
    return json(401, { error: 'sign in first' })
  })

  it('reaches the caller as offline (status 0), not as the 401, and keeps both tokens', async () => {
    withLocks()
    vi.stubGlobal('fetch', offline())
    const error = await cloudApi.printers().catch(e => e)
    expect(error).toBeInstanceOf(CloudError)
    expect((error as CloudError).status).toBe(0)
    expect(storedToken()).toBe('access-0')
    expect(storedRefreshToken()).toBe('refresh-0')
  })

  it('leaves the signed-in account and its tokens in place when the poll meets it', async () => {
    withLocks()
    vi.stubGlobal('fetch', offline())
    cloudState.account = { id: 'a', email: 'jack@example.test', name: 'Jack', created_at: 1 }
    await refreshPrinters()
    expect(cloudState.account).not.toBeNull()
    expect(storedToken()).toBe('access-0')
    expect(storedRefreshToken()).toBe('refresh-0')
  })

  it('still ends the session when the console refuses the refresh', async () => {
    withLocks()
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (
      new URL(url).pathname === '/token' ? json(400, { error: 'invalid_grant' }) : json(401, { error: 'sign in first' })
    )))
    cloudState.account = { id: 'a', email: 'jack@example.test', name: 'Jack', created_at: 1 }
    await refreshPrinters()
    expect(cloudState.account).toBeNull()
    expect(storedToken()).toBeNull()
  })

  it('gives up on a hung /token after the timeout and releases the lock', async () => {
    vi.useFakeTimers()
    withLocks()
    vi.stubGlobal('fetch', vi.fn((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    })))
    const pending = refreshSession()
    await vi.advanceTimersByTimeAsync(REFRESH_TIMEOUT_MS + 1)
    await expect(pending).resolves.toBe(false)
    expect(storedRefreshToken()).toBe('refresh-0')
  })
})

describe('recovery after a refusal', () => {
  it('stores nothing when the user signed out while the refresh was in flight', async () => {
    withLocks()
    const fetch = vi.fn(async (url: string) => {
      const u = new URL(url)
      if (u.pathname === '/token') {
        // Signed out elsewhere while the refresh was out.
        storeToken(null)
        storeRefreshToken(null)
        return json(400, { error: 'invalid_grant' })
      }
      throw new Error('prompt=none must not be asked after a sign-out')
    })
    vi.stubGlobal('fetch', fetch)
    await expect(refreshSession()).resolves.toBe(false)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(storedToken()).toBeNull()
  })

  it('does not store a pair if the stored token changed while the silent check ran', async () => {
    const fetch = vi.fn(async (url: string) => {
      const u = new URL(url)
      if (u.pathname === '/authorize') {
        // Another sign-in in the meantime.
        storeToken('access-other')
        storeRefreshToken('refresh-other')
        return {
          ok: true,
          redirected: true,
          url: `https://control.muon3d.com/?state=${u.searchParams.get('state')}&iss=${encodeURIComponent('https://control.muon3d.com')}&code=c`,
          body: { cancel: vi.fn(async () => {}) }
        } as unknown as Response
      }
      return json(200, { access_token: 'access-new', refresh_token: 'refresh-new', token_type: 'Bearer', expires_in: 900 })
    })
    vi.stubGlobal('fetch', fetch)
    await expect(recoverCentralSession('refresh-0', 1000)).resolves.toBe(false)
    expect(storedRefreshToken()).toBe('refresh-other')
  })
})

/** Tabs of one origin: every channel hears every other's messages. */
function hub () {
  const open = new Set<any>()
  let count = 0
  class Channel {
    onmessage: ((e: MessageEvent) => void) | null = null
    constructor () { open.add(this) }
    postMessage (data: unknown) {
      count++
      for (const other of open) {
        if (other !== this) setTimeout(() => other.onmessage?.({ data } as MessageEvent), 0)
      }
    }

    close () { open.delete(this) }
  }
  return { Channel, messages: () => count }
}

describe('the BroadcastChannel fallback', () => {
  it('runs three tabs one after another, with a bounded number of messages and no timeout wait', async () => {
    noLocks()
    const tabs = hub()
    vi.stubGlobal('BroadcastChannel', tabs.Channel)
    const order: string[] = []
    let inside = 0
    const run = (name: string) => withRefreshLock(async () => {
      inside++
      expect(inside).toBe(1)
      order.push(`${name}+`)
      await new Promise(resolve => setTimeout(resolve, 80))
      order.push(`${name}-`)
      inside--
    })
    const started = Date.now()
    await Promise.all([run('a'), run('b'), run('c')])
    expect(Date.now() - started).toBeLessThan(5000)
    expect(order).toHaveLength(6)
    // Each finished before the next began.
    for (let i = 0; i < 6; i += 2) expect(order[i].slice(0, 1)).toBe(order[i + 1].slice(0, 1))
    // 3 claims + at most 6 presents + 3 releases.
    expect(tabs.messages()).toBeLessThanOrEqual(12)
  })

  it('moves on when a holder dies without releasing', async () => {
    noLocks()
    vi.useFakeTimers()
    const tabs = hub()
    vi.stubGlobal('BroadcastChannel', tabs.Channel)
    // A dead tab: a claim with an id that sorts first, and nothing after.
    const ghost = new tabs.Channel()
    const ran = vi.fn()
    const waiting = withRefreshLock(async () => { ran() })
    ghost.postMessage({ type: 'claim', id: '0000000000-ghost' })
    await vi.advanceTimersByTimeAsync(1000)
    expect(ran).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(REFRESH_TIMEOUT_MS + 4000)
    await waiting
    expect(ran).toHaveBeenCalledOnce()
  })
})
