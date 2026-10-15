import { beforeEach, describe, expect, it } from 'vitest'
import { ControlPreferenceStore, type ControlPreferences, type PreferenceContext, type PreferenceRemote } from '../preferences'

const alice = { accountId: 'alice', printerId: 'printer-1', token: 'alice-session' }
const bob = { accountId: 'bob', printerId: 'printer-1', token: 'bob-session' }
const anonymous = { accountId: null, printerId: 'printer-1', token: null }
const empty = (): ControlPreferences => ({ version: 1, folds: {} })
function deferred<T> () {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((_resolve, _reject) => { resolve = _resolve; reject = _reject })
  return { promise, resolve, reject }
}
function service () {
  const data = new Map<string, ControlPreferences>()
  const writes: PreferenceContext[] = []
  const key = (c: PreferenceContext) => `${c.accountId}/${c.printerId}`
  const remote: PreferenceRemote = {
    read: async c => structuredClone(data.get(key(c)) ?? empty()),
    patch: async (c, folds) => {
      writes.push({ ...c })
      const next = { version: 1 as const, folds: { ...data.get(key(c))?.folds, ...folds } }
      data.set(key(c), next)
      return structuredClone(next)
    }
  }
  return { remote, writes }
}

describe('personal Control choices', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips two clients and patches independent folds without replacing another printer', async () => {
    const { remote } = service()
    const first = new ControlPreferenceStore(remote, localStorage)
    const second = new ControlPreferenceStore(remote, localStorage)
    await first.select(alice)
    await second.select(alice)
    await first.setFold('heat.other', true)
    await second.setFold('fans.all', true)
    const third = new ControlPreferenceStore(remote, localStorage)
    await third.select(alice)
    expect(third.state.folds).toEqual({ 'heat.other': true, 'fans.all': true })
    await third.select({ ...alice, printerId: 'printer-2' })
    expect(third.state.folds).toEqual({})
    await third.select(bob)
    expect(third.state.folds).toEqual({})
  })

  it('remembers anonymous choices on remount but never imports them into a signed-in account', async () => {
    const { remote, writes } = service()
    const first = new ControlPreferenceStore(remote, localStorage)
    await first.select(anonymous)
    await first.setFold('heat.other', true)
    const second = new ControlPreferenceStore(remote, localStorage)
    await second.select(anonymous)
    expect(second.state.folds).toEqual({ 'heat.other': true })
    await second.select(alice)
    expect(second.state.folds).toEqual({})
    expect(writes).toEqual([])
    await second.setFold('fans.all', true)
    await second.select(anonymous)
    expect(second.state.folds).toEqual({ 'heat.other': true })
  })

  it.each([bob, anonymous, { ...alice, printerId: 'printer-2' }])('clears immediately and discards late reads on context change to %j', async context => {
    const { remote } = service()
    const late = deferred<ControlPreferences>()
    const first = new ControlPreferenceStore({ ...remote, read: c => c.accountId === 'alice' && c.printerId === 'printer-1' ? late.promise : remote.read(c) }, localStorage)
    const pending = first.select(alice)
    const next = first.select(context)
    expect(first.state.folds).toEqual({})
    await next
    late.resolve({ version: 1, folds: { private: true } })
    await pending
    expect(first.state.folds).toEqual({})
    await first.select(anonymous)
    expect(first.state.folds).toEqual({})
  })

  it.each([bob, anonymous, { ...alice, printerId: 'printer-2' }])('cancels queued writes and discards late replies on context change to %j', async context => {
    const { remote, writes } = service()
    const late = deferred<ControlPreferences>()
    let calls = 0
    const store = new ControlPreferenceStore({ ...remote, patch: async (c, f) => { calls++; return calls === 1 ? late.promise : remote.patch(c, f) } }, localStorage)
    await store.select(alice)
    const first = store.setFold('heat.other', true)
    await Promise.resolve()
    const second = store.setFold('heat.other', false)
    expect(store.state.folds['heat.other']).toBe(false)
    await store.select(context)
    late.resolve({ version: 1, folds: { 'heat.other': true } })
    await Promise.all([first, second])
    expect(writes).toEqual([])
    expect(store.state.folds).toEqual({})
  })

  it('does not pretend failed synchronization or unknown versions are saved; retries the intended fold', async () => {
    const { remote } = service()
    let unavailable = true
    const store = new ControlPreferenceStore({ ...remote, read: async c => { if (unavailable) throw new Error('Not available'); return remote.read(c) } }, localStorage)
    await store.select(alice)
    expect(store.state.error).toContain('not saved')
    expect(store.state.ready).toBe(false)
    unavailable = false
    await store.setFold('heat.other', true)
    expect(store.state.error).toBe('')
    const second = new ControlPreferenceStore(remote, localStorage)
    await second.select(alice)
    expect(second.state.folds).toEqual({ 'heat.other': true })
    const future = new ControlPreferenceStore({ ...remote, read: async () => ({ version: 2, folds: { private: true } } as unknown as ControlPreferences) }, localStorage)
    await future.select(alice)
    expect(future.state.folds).toEqual({})
    expect(future.state.error).toContain('not saved')
  })

  it('does not persist before stable identity or when anonymous storage is unavailable', async () => {
    const { remote, writes } = service()
    const broken = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } } as unknown as Storage
    const store = new ControlPreferenceStore(remote, broken)
    await store.select({ ...alice, printerId: null })
    await store.setFold('heat.other', true)
    expect(writes).toEqual([])
    await store.select(anonymous)
    await store.setFold('heat.other', true)
    expect(store.state.error).toContain('not saved')
  })

  it('refreshes a saved fold from another device instead of keeping an old local edit forever', async () => {
    const { remote } = service()
    const first = new ControlPreferenceStore(remote, localStorage)
    const second = new ControlPreferenceStore(remote, localStorage)
    await first.select(alice)
    await first.setFold('heat.other', true)
    await second.select(alice)
    await second.setFold('heat.other', false)
    await first.refresh()
    expect(first.state.folds['heat.other']).toBe(false)
  })

  it('does not let a read started before an edit undo its successful write', async () => {
    const { remote } = service()
    const late = deferred<ControlPreferences>()
    const store = new ControlPreferenceStore({ ...remote, read: () => late.promise }, localStorage)
    const reading = store.select(alice)
    await store.setFold('heat.other', true)
    late.resolve(empty())
    await reading
    expect(store.state.folds['heat.other']).toBe(true)
  })
})
