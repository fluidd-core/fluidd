import { expect, it } from 'vitest'
import { ControlPreferenceStore, type ControlPreferences } from '../preferences'

it('round trips the ordered layout, resets without losing folds and isolates account/printer contexts', async () => {
  const records = new Map<string, any>()
  const record = (c: any) => records.get(`${c.accountId}/${c.printerId}`) ?? { version: 2, folds: {}, overview: { cards: null } }
  const remote = {
    read: async (c: any) => record(c),
    patch: async (c: any, folds: Record<string, boolean>) => {
      const current = record(c)
      const value = { ...current, folds: { ...current.folds, ...folds } }
      records.set(`${c.accountId}/${c.printerId}`, value)
      return value as ControlPreferences
    },
    patchLayout: async (c: any, cards: string[] | null) => {
      const current = record(c)
      const value = { ...current, version: 2 as const, overview: { cards } }
      records.set(`${c.accountId}/${c.printerId}`, value)
      return value
    }
  }
  const store = new ControlPreferenceStore(remote, localStorage) as any
  const alice = { accountId: 'alice', printerId: 'a', token: 'session-a' }
  await store.select(alice)
  await store.setLayout(['console', 'queue'])
  await store.setFold('heat', true)
  await store.refresh()
  expect(store.state.layout).toEqual(['console', 'queue'])
  expect(store.state.folds).toEqual({ heat: true })
  await store.setLayout(null)
  expect(store.state.layout).toBe(null)
  expect(store.state.folds).toEqual({ heat: true })
  await store.select({ ...alice, accountId: 'bob' })
  expect(store.state.layout).toBe(null)
  await store.select({ ...alice, printerId: 'b' })
  expect(store.state.layout).toBe(null)
})

it('discards old account reads and queued layout writes without adopting anonymous choices', async () => {
  let finishRead!: (v: any) => void
  const read = new Promise<any>(resolve => { finishRead = resolve })
  const writes: any[] = []
  const store = new ControlPreferenceStore({ read: () => read, patch: async () => ({ version: 1, folds: {} }), patchLayout: async (c: any) => { writes.push(c); return { version: 2, folds: {}, overview: { cards: [] } } } } as any, localStorage) as any
  const old = store.select({ accountId: 'alice', printerId: 'a', token: 'alice-session' })
  const save = store.setLayout(['console'])
  await store.select({ accountId: null, printerId: null, token: null })
  finishRead({ version: 2, folds: {}, overview: { cards: ['camera'] } })
  await old; await save
  expect(store.state.layout).toBe(null)
  expect(writes).toEqual([])
})

it('retains a failed personal arrangement through same-account session refresh and retries with the fresh captured session', async () => {
  const writes: string[] = []
  const store = new ControlPreferenceStore({
    read: async () => ({ version: 2, folds: {}, overview: { cards: null } }),
    patch: async () => ({ version: 1, folds: {} }),
    patchLayout: async (context, cards) => {
      writes.push(context.token!)
      if (context.token === 'expired') throw new Error('expired')
      return { version: 2, folds: {}, overview: { cards } }
    }
  }, localStorage)
  await store.select({ accountId: 'alice', printerId: 'a', token: 'expired' })
  await store.setLayout(['console'])
  expect(store.state.layoutError).not.toBe('')
  await store.select({ accountId: 'alice', printerId: 'a', token: 'fresh' })
  expect(store.state.layout).toEqual(['console'])
  await store.retry()
  expect(writes).toEqual(['expired', 'fresh'])
  expect(store.state.layoutError).toBe('')
})

it('keeps anonymous arrangements browser-local and never adopts them on sign-in', async () => {
  localStorage.clear()
  const remote = { read: async () => ({ version: 2 as const, folds: {}, overview: { cards: null } }), patch: async () => ({ version: 1 as const, folds: {} }) }
  const first = new ControlPreferenceStore(remote, localStorage)
  await first.select({ accountId: null, printerId: 'a', token: null })
  await first.setLayout(['console'])
  const second = new ControlPreferenceStore(remote, localStorage)
  await second.select({ accountId: null, printerId: 'a', token: null })
  expect(second.state.layout).toEqual(['console'])
  await second.select({ accountId: 'alice', printerId: 'a', token: 'alice-session' })
  expect(second.state.layout).toBe(null)
})
