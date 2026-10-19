import { expect, it } from 'vitest'
import { ControlPreferenceStore, type ControlPreferences } from '../preferences'

function deferred<T> () {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(r => { resolve = r })
  return { promise, resolve }
}

const v2 = (cards: string[] | null): ControlPreferences => ({ version: 2, folds: {}, overview: { cards } })
const account = { accountId: 'alice', printerId: 'a', token: 'old-token' }

function remoteWith (patchLayout: (cards: string[] | null) => Promise<ControlPreferences>) {
  return {
    read: async () => v2(null),
    patch: async () => ({ version: 1, folds: {} } as ControlPreferences),
    patchLayout: async (_context: unknown, cards: string[] | null) => patchLayout(cards)
  }
}

it('keeps an unsaved layout marked unsaved when the session token rotates mid-save', async () => {
  const late = deferred<ControlPreferences>()
  const store = new ControlPreferenceStore(remoteWith(() => late.promise), localStorage)
  await store.select(account)
  const saving = store.setLayout(['queue'])
  await Promise.resolve()
  const selecting = store.select({ ...account, token: 'fresh-token' })
  expect(store.state.layout).toEqual(['queue'])
  expect(store.state.layoutError).toContain('refreshed session')
  // The old session's answer arrives late: it must neither replace the layout nor clear the warning.
  late.resolve(v2(['temperatures']))
  await Promise.all([saving, selecting])
  expect(store.state.layout).toEqual(['queue'])
  expect(store.state.layoutError).toContain('refreshed session')
})

it('still applies a save that finishes under an unchanged session', async () => {
  const store = new ControlPreferenceStore(remoteWith(async cards => v2(cards)), localStorage)
  await store.select(account)
  await store.setLayout(['queue'])
  expect(store.state.layout).toEqual(['queue'])
  expect(store.state.layoutError).toBe('')
})
