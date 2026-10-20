import { describe, expect, it, vi } from 'vitest'
import { isStaleChunkError, reloadForNewBuild, type ReloadDeps } from '../stale-build'

const deps = (now = 100_000, stored: Record<string, string> = {}): ReloadDeps & { stored: Record<string, string> } => ({
  buildId: 'old-build',
  stored,
  now: () => now,
  storage: {
    getItem: (k: string) => stored[k] ?? null,
    setItem: (k: string, v: string) => { stored[k] = v }
  },
  assign: vi.fn(),
  reload: vi.fn()
})

describe('isStaleChunkError', () => {
  it.each([
    'Failed to fetch dynamically imported module: https://app.muon3d.com/assets/OverviewRoute-7ETdUqW6.js',
    'Importing a module script failed.',
    'error loading dynamically imported module: https://app.muon3d.com/assets/x.js',
    'Unable to preload CSS for /assets/x.css'
  ])('recognises %s', (message) => {
    expect(isStaleChunkError(new TypeError(message))).toBe(true)
  })

  it('leaves other errors alone', () => {
    expect(isStaleChunkError(new Error('Navigation cancelled'))).toBe(false)
    expect(isStaleChunkError(undefined)).toBe(false)
  })
})

describe('reloadForNewBuild', () => {
  it('refreshes the browser worker before reloading a stale sign-in route', async () => {
    let updated!: () => void
    const d = deps()
    const update = vi.fn(() => new Promise<void>(resolve => { updated = resolve }))
    vi.stubGlobal('window', { sessionStorage: d.storage, location: { assign: d.assign, reload: d.reload } })
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: async () => ({ update, waiting: null, installing: null }) } })
    try {
      const target = '/sign-in?continue=%2Fauthorize%3Fclient_id%3Dlibrary'
      expect(reloadForNewBuild(target)).toBe(true)
      expect(d.assign).not.toHaveBeenCalled()
      await Promise.resolve()
      expect(update).toHaveBeenCalledTimes(1)
      updated()
      await new Promise(resolve => setTimeout(resolve))
      expect(d.assign).toHaveBeenCalledTimes(1)
      expect(d.assign).toHaveBeenCalledWith(target)
    } finally { vi.unstubAllGlobals() }
  })

  it('loads the page it was going to', () => {
    const d = deps()
    expect(reloadForNewBuild('/gimlet-6741', d)).toBe(true)
    expect(d.assign).toHaveBeenCalledWith('/gimlet-6741')
    expect(d.reload).not.toHaveBeenCalled()
  })

  it('reloads in place when it does not know where it was going', () => {
    const d = deps()
    expect(reloadForNewBuild(undefined, d)).toBe(true)
    expect(d.reload).toHaveBeenCalledTimes(1)
  })

  it('does not reload again moments after it already did', () => {
    const first = deps(100_000)
    reloadForNewBuild('/a', first)
    const again = deps(105_000, first.stored)
    expect(reloadForNewBuild('/a', again)).toBe(false)
    expect(again.assign).not.toHaveBeenCalled()
  })

  it('does not loop when an old worker still serves the same build after ten seconds', () => {
    const first = deps(100_000)
    reloadForNewBuild('/a', first)
    const later = deps(111_000, first.stored)
    expect(reloadForNewBuild('/a', later)).toBe(false)
    expect(later.assign).not.toHaveBeenCalled()
    expect(reloadForNewBuild('/a', { ...later, buildId: 'new-build' })).toBe(true)
  })

  it('updates the worker before returning to the full requested sign-in address', async () => {
    let ready!: () => void
    const prepareReload = vi.fn(() => new Promise<void>(resolve => { ready = resolve }))
    const d = { ...deps(), prepareReload }
    const target = '/sign-in?continue=%2Fauthorize%3Fclient_id%3Dlibrary'
    expect(reloadForNewBuild(target, d)).toBe(true)
    expect(prepareReload).toHaveBeenCalledTimes(1)
    expect(d.assign).not.toHaveBeenCalled()
    // Vite and the router can both report the same failed import.
    expect(reloadForNewBuild(target, d)).toBe(false)
    ready()
    await new Promise(resolve => setTimeout(resolve))
    expect(d.assign).toHaveBeenCalledTimes(1)
    expect(d.assign).toHaveBeenCalledWith(target)
  })

  it('still reloads once when refreshing the worker fails', async () => {
    const d = { ...deps(), prepareReload: () => Promise.reject(new Error('offline')) }
    expect(reloadForNewBuild('/sign-in', d)).toBe(true)
    await new Promise(resolve => setTimeout(resolve))
    expect(d.assign).toHaveBeenCalledTimes(1)
    expect(d.assign).toHaveBeenCalledWith('/sign-in')
  })

  it('does not reload when it has no storage to remember the reload in', () => {
    const d = { ...deps(), storage: null }
    expect(reloadForNewBuild('/a', d)).toBe(false)
    expect(d.assign).not.toHaveBeenCalled()
  })

  it('does not reload when storage refuses the write', () => {
    const d = deps()
    d.storage = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError') } }
    expect(reloadForNewBuild('/a', d)).toBe(false)
    expect(d.assign).not.toHaveBeenCalled()
  })
})
