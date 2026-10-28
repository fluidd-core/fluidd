/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 */
// Two tabs as two copies of the module (each with its own in-flight refresh),
// sharing one localStorage and one origin-wide lock, against a console that
// does what the real one does with a refresh token used twice: it ends the
// session (KAN-932, CONTROL-401).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Api = typeof import('../api')

/** A console that rotates refresh tokens and ends the family on reuse. */
function fakeConsole () {
  let generation = 0
  let live: string | null = 'refresh-0'
  const used = new Set<string>()
  const spent: string[] = []
  let reused = false
  const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const form = new URLSearchParams(String(init?.body ?? ''))
    const token = form.get('refresh_token') ?? ''
    spent.push(token)
    // A turn of the event loop, so another tab can ask in the meantime.
    await new Promise(resolve => setTimeout(resolve, 5))
    if (used.has(token)) {
      reused = true
      live = null
    }
    if (token !== live) return { ok: false, status: 400, json: async () => ({ error: 'invalid_grant' }) } as Response
    used.add(token)
    generation++
    live = `refresh-${generation}`
    return { ok: true, status: 200, json: async () => ({ access_token: `access-${generation}`, refresh_token: live, token_type: 'Bearer', expires_in: 900 }) } as Response
  })
  return { fetch, spent, get reused () { return reused } }
}

/** `navigator.locks` for one origin: one holder at a time, first come first served. */
function originLocks () {
  let tail: Promise<unknown> = Promise.resolve()
  return {
    request: (_name: string, work: () => Promise<unknown>) => {
      const run = tail.then(work)
      tail = run.catch(() => {})
      return run
    }
  }
}

async function openTab (): Promise<Api> {
  vi.resetModules()
  return import('../api')
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('muon.cloud.token', 'access-0')
  localStorage.setItem('muon.cloud.refresh', 'refresh-0')
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('two tabs that meet a 401 at once', () => {
  it('spend the refresh token once and both carry on signed in', async () => {
    const service = fakeConsole()
    vi.stubGlobal('fetch', service.fetch)
    const [a, b] = [await openTab(), await openTab()]
    vi.stubGlobal('navigator', { locks: originLocks() })

    const results = await Promise.all([a.refreshSession(), b.refreshSession()])

    expect(results).toEqual([true, true])
    expect(service.spent).toEqual(['refresh-0'])
    expect(service.reused).toBe(false)
    expect(a.storedToken()).toBe('access-1')
    expect(b.storedRefreshToken()).toBe('refresh-1')
  })

  it('three tabs, then a later refresh, each spend a token only once', async () => {
    const service = fakeConsole()
    vi.stubGlobal('fetch', service.fetch)
    const tabs = [await openTab(), await openTab(), await openTab()]
    vi.stubGlobal('navigator', { locks: originLocks() })

    await Promise.all(tabs.map(t => t.refreshSession()))
    await expect(tabs[2].refreshSession()).resolves.toBe(true)

    expect(service.spent).toEqual(['refresh-0', 'refresh-1'])
    expect(service.reused).toBe(false)
    expect(tabs[0].storedRefreshToken()).toBe('refresh-2')
  })

  // What the lock is for: without it, the second tab spends the same token and the console ends the session.
  it('without the lock the console sees the token twice and ends the session', async () => {
    const service = fakeConsole()
    vi.stubGlobal('fetch', service.fetch)
    const [a, b] = [await openTab(), await openTab()]
    vi.stubGlobal('navigator', { locks: { request: (_n: string, work: () => Promise<unknown>) => work() } })

    await Promise.all([a.refreshSession(), b.refreshSession()])

    expect(service.spent).toEqual(['refresh-0', 'refresh-0'])
    expect(service.reused).toBe(true)
  })
})
