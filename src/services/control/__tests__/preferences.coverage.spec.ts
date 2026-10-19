import { beforeEach, describe, expect, it } from 'vitest'
import { ControlPreferenceStore, validateLayout, validatePreferences, type ControlPreferences, type PreferenceContext, type PreferenceRemote } from '../preferences'

const account: PreferenceContext = { accountId: 'alice', printerId: 'm1', token: 'token' }
const v2 = (cards: string[] | null = null): ControlPreferences => ({ version: 2, folds: {}, overview: { cards } })
const remote = (overrides: Partial<PreferenceRemote> = {}): PreferenceRemote => ({
  read: async () => v2(),
  patch: async (_context, folds) => ({ ...v2(), folds }),
  patchLayout: async (_context, cards) => v2(cards),
  ...overrides
})
const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(_resolve => { resolve = _resolve })
  return { promise, resolve }
}

describe('Control preference hardening branches', () => {
  beforeEach(() => localStorage.clear())

  it('rejects malformed fold containers, values, keys, and excessive entries', () => {
    const bad = [
      { version: 1, folds: [] },
      { version: 1, folds: { ok: 'yes' } },
      { version: 1, folds: { 'not allowed': true } },
      { version: 1, folds: Object.fromEntries(Array.from({ length: 65 }, (_, i) => [`k${i}`, true])) }
    ]
    for (const value of bad) expect(() => validatePreferences(value)).toThrow('Unsupported Control preferences')
  })

  it('rejects v2 without Overview and layouts with duplicates, unknown cards, or too many cards', () => {
    expect(() => validatePreferences({ version: 2, folds: {} })).toThrow('Unsupported Overview preferences')
    for (const cards of [['queue', 'queue'], ['future-card'], Array(13).fill('queue')]) {
      expect(() => validateLayout(cards)).toThrow('Unsupported Overview layout')
    }
  })

  it('ignores invalid fold keys without changing visible or remote state', async () => {
    let writes = 0
    const store = new ControlPreferenceStore(remote({ patch: async () => { writes++; return v2() } }), localStorage)
    await store.select(account)
    for (const key of ['', 'has space', 'x'.repeat(65)]) await store.setFold(key, true)
    expect(store.state.folds).toEqual({})
    expect(writes).toBe(0)
  })

  it('keeps an unidentified layout only for the visit and explains it is unsaved', async () => {
    const store = new ControlPreferenceStore(remote(), localStorage)
    await store.select({ ...account, printerId: null })
    await store.setLayout(['queue'])
    expect(store.state.layout).toEqual(['queue'])
    expect(store.state.layoutError).toContain('until this printer is identified')
  })

  it('reports signed-in layout sync as unavailable when patchLayout is missing', async () => {
    const service = remote()
    delete service.patchLayout
    const store = new ControlPreferenceStore(service, localStorage)
    await store.select(account)
    await store.setLayout(['queue'])
    expect(store.state.layout).toEqual(['queue'])
    expect(store.state.layoutError).toContain('not saved')
  })

  it('does not apply a late layout response after the selected printer changes', async () => {
    const late = deferred<ControlPreferences>()
    const store = new ControlPreferenceStore(remote({ patchLayout: async () => late.promise }), localStorage)
    await store.select(account)
    const saving = store.setLayout(['queue'])
    await Promise.resolve()
    await store.select({ ...account, printerId: 'other' })
    late.resolve(v2(['temperatures']))
    await saving
    expect(store.state.layout).toBeNull()
  })

  it('preserves an unsaved layout across a refreshed token for the same account and printer', async () => {
    const late = deferred<ControlPreferences>()
    const store = new ControlPreferenceStore(remote({ patchLayout: async () => late.promise }), localStorage)
    await store.select(account)
    const saving = store.setLayout(['queue'])
    await Promise.resolve()
    const selecting = store.select({ ...account, token: 'fresh-token' })
    expect(store.state.layout).toEqual(['queue'])
    expect(store.state.layoutError).toContain('refreshed session')
    late.resolve(v2(['temperatures']))
    await Promise.all([saving, selecting])
    expect(store.state.layout).toEqual(['queue'])
  })

  it('reports corrupt anonymous layout storage without exposing its data', async () => {
    localStorage.setItem('muon.overview.v2.anonymous.m1', JSON.stringify(['unknown']))
    const store = new ControlPreferenceStore(remote(), localStorage)
    await store.select({ accountId: null, printerId: 'm1', token: null })
    expect(store.state.layout).toBeNull()
    expect(store.state.error).toContain('not saved')
    expect(store.state.ready).toBe(false)
  })
})
