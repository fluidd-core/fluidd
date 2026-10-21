/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { refreshSession, setSessionRecovery, storedRefreshToken, storedToken, storeRefreshToken, storeToken, withRefreshLock } from '../api'
import { recoverCentralSession, resetRecovery } from '../centralLogin'

function tokenAnswer (access: string, refresh: string): Response {
  return { ok: true, status: 200, json: async () => ({ access_token: access, refresh_token: refresh, token_type: 'Bearer', expires_in: 900 }) } as Response
}
function refused (): Response {
  return { ok: false, status: 400, json: async () => ({ error: 'invalid_grant' }) } as Response
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
  setSessionRecovery(null)
  resetRecovery()
})

describe('refresh across tabs', () => {
  it('serialises refreshes through navigator.locks', async () => {
    const order: string[] = []
    let tail: Promise<unknown> = Promise.resolve()
    vi.stubGlobal('navigator', {
      locks: {
        request: (name: string, work: () => Promise<unknown>) => {
          expect(name).toBe('muon.cloud.refresh')
          const run = tail.then(work)
          tail = run.catch(() => {})
          return run
        }
      }
    })
    const a = withRefreshLock(async () => { order.push('a1'); await Promise.resolve(); order.push('a2') })
    const b = withRefreshLock(async () => { order.push('b1') })
    await Promise.all([a, b])
    expect(order).toEqual(['a1', 'a2', 'b1'])
  })

  it('skips the refresh when another tab rotated the pair while this one waited', async () => {
    const fetch = vi.fn(async () => tokenAnswer('never', 'never'))
    vi.stubGlobal('fetch', fetch)
    vi.stubGlobal('navigator', {
      locks: {
        request: async (_name: string, work: () => Promise<unknown>) => {
          // The other tab held the lock first and stored its new pair.
          storeToken('access-1')
          storeRefreshToken('refresh-1')
          return work()
        }
      }
    })
    await expect(refreshSession()).resolves.toBe(true)
    expect(fetch).not.toHaveBeenCalled()
    expect(storedToken()).toBe('access-1')
    expect(storedRefreshToken()).toBe('refresh-1')
  })

  it('spends the stored refresh token once for concurrent callers', async () => {
    const fetch = vi.fn(async () => tokenAnswer('access-1', 'refresh-1'))
    vi.stubGlobal('fetch', fetch)
    vi.stubGlobal('navigator', { locks: { request: (_n: string, work: () => Promise<unknown>) => work() } })
    const results = await Promise.all([refreshSession(), refreshSession()])
    expect(results).toEqual([true, true])
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(storedRefreshToken()).toBe('refresh-1')
  })

  it('falls back to a BroadcastChannel claim when there are no locks', async () => {
    vi.stubGlobal('navigator', {})
    const posted: unknown[] = []
    class Channel {
      onmessage: ((e: MessageEvent) => void) | null = null
      postMessage (m: unknown) { posted.push(m) }
      close () {}
    }
    vi.stubGlobal('BroadcastChannel', Channel)
    const ran = vi.fn()
    await withRefreshLock(async () => { ran() })
    expect(ran).toHaveBeenCalled()
    expect(posted).toEqual([
      expect.objectContaining({ type: 'claim' }),
      expect.objectContaining({ type: 'done' })
    ])
  })
})

describe('a failed refresh', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { locks: { request: (_n: string, work: () => Promise<unknown>) => work() } })
  })

  it('tries the silent sign-in once and keeps the session when it works', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => refused()))
    const recover = vi.fn(async () => {
      storeToken('access-2')
      storeRefreshToken('refresh-2')
      return true
    })
    setSessionRecovery(recover)
    await expect(refreshSession()).resolves.toBe(true)
    expect(recover).toHaveBeenCalledTimes(1)
    expect(storedToken()).toBe('access-2')
  })

  it('drops both tokens when the silent sign-in finds nothing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => refused()))
    setSessionRecovery(async () => false)
    await expect(refreshSession()).resolves.toBe(false)
    expect(storedToken()).toBeNull()
    expect(storedRefreshToken()).toBeNull()
  })

  it('keeps the session when the console cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline') }))
    const recover = vi.fn(async () => true)
    setSessionRecovery(recover)
    await expect(refreshSession()).resolves.toBe(false)
    expect(recover).not.toHaveBeenCalled()
    expect(storedRefreshToken()).toBe('refresh-0')
  })

  it('asks /authorize with prompt=none, and not again within a minute', async () => {
    const fetch = vi.fn(async (url: string) => {
      const u = new URL(url)
      expect(u.pathname).toBe('/authorize')
      expect(u.searchParams.get('prompt')).toBe('none')
      return {
        ok: true,
        redirected: true,
        url: `https://control.muon3d.com/?state=${u.searchParams.get('state')}&iss=${encodeURIComponent('https://control.muon3d.com')}&error=login_required`,
        body: { cancel: vi.fn(async () => {}) }
      } as unknown as Response
    })
    vi.stubGlobal('fetch', fetch)
    await expect(recoverCentralSession(1000)).resolves.toBe(false)
    await expect(recoverCentralSession(2000)).resolves.toBe(false)
    expect(fetch).toHaveBeenCalledTimes(1)
    await expect(recoverCentralSession(70000)).resolves.toBe(false)
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
