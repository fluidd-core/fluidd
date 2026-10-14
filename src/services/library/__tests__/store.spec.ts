/**
 * @vitest-environment node
 */
import Vue from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PROMISE_SUMMARY, PROMISE_URL, PROMISE_VERSION } from '../promise'
import { fakeService } from './fakeService'

const cloud = vi.hoisted(() => ({ state: null as unknown as { account: { id: string } | null } }))

vi.mock('@/services/muon-cloud/state', async () => {
  const { default: V } = await import('vue')
  cloud.state = V.observable({ account: null as { id: string } | null })
  return { cloudState: cloud.state, cloudPrinterConnection: vi.fn() }
})

const store = await import('../store')

beforeEach(() => {
  cloud.state.account = { id: 'jack' }
  store.resetLibrary('jack')
})

describe('the Library store', () => {
  it('reads an account\'s Library: on, its preferences, its storage and its prints', async () => {
    const service = fakeService({ presign: true })
    store.setLibraryClient(service.client())
    await store.refreshLibrary()
    expect(store.libraryState).toMatchObject({ account: 'jack', checked: true, enabled: true, usedBytes: 1234, quotaBytes: 1e9 })
    expect(store.libraryState.preferences).toMatchObject({ autosave: false, ask: true, save_from_print_check: true })
    expect(store.libraryState.synced).toBe(true)
    expect(store.libraryStatus()).toEqual({
      signedIn: true,
      enabled: true,
      promise: null,
      preferences: { autosave: false, ask: true },
      usedBytes: 1234,
      quotaBytes: 1e9
    })
  })

  it('a Library that is off offers the promise this Fluidd shows, and holds no prints', async () => {
    store.setLibraryClient(fakeService({ enabled: false }).client())
    await store.refreshLibrary()
    expect(store.libraryState.enabled).toBe(false)
    expect(store.libraryPrints()).toEqual([])
    expect(store.libraryStatus().promise).toEqual({ version: PROMISE_VERSION, summary: PROMISE_SUMMARY, url: PROMISE_URL })
  })

  it('offers no promise when the service wants another version than the text shown here', () => {
    Object.assign(store.libraryState, { enabled: false, promiseVersion: '2099-01-01' })
    expect(store.libraryStatus().promise).toBeNull()
  })

  it('signed out, says so and nothing else', () => {
    store.resetLibrary(null)
    expect(store.libraryStatus()).toEqual({ signedIn: false, enabled: false, promise: null, preferences: null, usedBytes: null, quotaBytes: null })
  })

  it('a save lands in the list, and a sync keeps it', async () => {
    const service = fakeService({ presign: true })
    store.setLibraryClient(service.client())
    await store.refreshLibrary()
    const saved = await store.saveFromSlicer({
      item: null,
      name: 'Cube',
      origin: 'save',
      consent: null,
      project: new Uint8Array([1, 2]).buffer,
      outputs: [],
      thumbnail: null,
      summary: {}
    })
    expect(store.libraryPrints().map(p => p.id)).toEqual([saved.item.id])
    await store.syncLibrary()
    expect(store.libraryPrints().map(p => p.id)).toEqual([saved.item.id])
  })

  it('a feed answering consent_required turns the Library off here and forgets the prints', async () => {
    const service = fakeService({ presign: true })
    store.setLibraryClient(service.client())
    await store.refreshLibrary()
    Vue.set(store.libraryState.items, 'x', { id: 'x', state: 'ready', versioned: true, updated_at: '' })
    service.setEnabled(false)
    await store.syncLibrary()
    expect(store.libraryState.enabled).toBe(false)
    expect(store.libraryState.items).toEqual({})
    expect(store.libraryState.errorCode).toBe('consent_required')
  })

  it('a change of account starts the Library again', async () => {
    store.setLibraryClient(fakeService({ presign: true }).client())
    store.watchLibraryAccount()
    await store.refreshLibrary()
    Vue.set(store.libraryState.items, 'x', { id: 'x', state: 'ready', versioned: true, updated_at: '' })
    cloud.state.account = null
    await Vue.nextTick()
    expect(store.libraryState.account).toBeNull()
    expect(store.libraryState.items).toEqual({})
  })
})
