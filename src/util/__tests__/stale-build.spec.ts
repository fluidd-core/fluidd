import { describe, expect, it, vi } from 'vitest'
import { isStaleChunkError, reloadForNewBuild, type ReloadDeps } from '../stale-build'

const deps = (now = 100_000, stored: Record<string, string> = {}): ReloadDeps & { stored: Record<string, string> } => ({
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

  it('reloads again once the window has passed', () => {
    const first = deps(100_000)
    reloadForNewBuild('/a', first)
    const later = deps(111_000, first.stored)
    expect(reloadForNewBuild('/a', later)).toBe(true)
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
