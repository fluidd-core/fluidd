/**
 * @vitest-environment node
 */
import Vue from 'vue'
import { createLibraryClient, LibraryError } from '../api'
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

describe('Library feed outcomes', () => {
  it('reports a feed 401 after a successful status check', async () => {
    const service = fakeService({ presign: true })
    service.queue(/^\/v1\/items$/, 401, { error: { code: 'not_signed_in', message: 'Sign in again.' } })
    service.queue(/^\/v1\/items$/, 401, { error: { code: 'not_signed_in', message: 'Sign in again.' } })
    store.setLibraryClient(service.client())

    await store.refreshLibrary()

    expect(store.libraryState).toMatchObject({
      checked: true,
      synced: false,
      feedLoading: false,
      errorCode: 'not-signed-in'
    })
    expect(store.libraryState.error).toBeTruthy()
  })

  it('reports a feed network failure after a successful status check', async () => {
    const service = fakeService({ presign: true })
    const client = createLibraryClient({
      baseUrl: 'https://models.example',
      assertion: { get: async () => 'assertion', drop: () => {} },
      fetch: (async (input, init) => {
        if (new URL(String(input)).pathname === '/v1/items') throw new TypeError('Failed to fetch')
        return service.fetch(input, init)
      }) as typeof fetch
    })
    store.setLibraryClient(client)

    await store.refreshLibrary()

    expect(store.libraryState).toMatchObject({
      checked: true,
      synced: false,
      feedLoading: false,
      errorCode: 'offline',
      error: "Your Library can't be reached. Check this computer's internet connection."
    })
  })

  it('keeps a preference failure visible after the feed succeeds and clears it on retry', async () => {
    const service = fakeService({ presign: true })
    const client = service.client()
    vi.spyOn(client, 'preferences').mockRejectedValueOnce(new LibraryError('service_unavailable', 'Preferences unavailable'))
    store.setLibraryClient(client)

    await store.refreshLibrary()

    expect(store.libraryState).toMatchObject({
      checked: true,
      synced: true,
      feedLoading: false,
      error: 'Preferences unavailable'
    })

    await store.syncLibrary()
    expect(store.libraryState.error).toBe('Preferences unavailable')

    await store.refreshLibrary()
    expect(store.libraryState.error).toBeNull()
  })

  it('retains synced items when a refresh fails and clears the error after a successful feed retry', async () => {
    const service = fakeService({ presign: true })
    const client = service.client()
    store.setLibraryClient(client)
    await store.refreshLibrary()
    const item = {
      id: 'existing',
      kind: 'plate',
      format: '3mf',
      name: 'Existing print',
      size_bytes: 10,
      has_thumbnail: false,
      state: 'ready',
      rev: 1,
      created_at: '2026-10-12T10:00:00Z',
      updated_at: '2026-10-12T10:00:00Z',
      deleted_at: null,
      versioned: true
    }
    Vue.set(store.libraryState.items, item.id, item)
    const rev = store.libraryState.rev
    vi.spyOn(client, 'feed').mockRejectedValueOnce(new LibraryError('offline', 'Network failed'))

    await store.refreshLibrary()

    expect(store.libraryState.items).toEqual({ existing: item })
    expect(store.libraryState).toMatchObject({ rev, synced: true, feedLoading: false, errorCode: 'offline' })

    await store.syncLibrary()
    expect(store.libraryState.error).toBeNull()
    expect(store.libraryState.errorCode).toBeNull()
  })

  it('tracks the initial feed as loading until it succeeds', async () => {
    const service = fakeService({ presign: true })
    const client = service.client()
    const feed = client.feed.bind(client)
    let release!: () => void
    const pending = new Promise<void>(resolve => { release = resolve })
    vi.spyOn(client, 'feed').mockImplementationOnce(async since => {
      await pending
      return feed(since)
    })
    store.setLibraryClient(client)

    const refresh = store.refreshLibrary()
    try {
      await vi.waitFor(() => expect(store.libraryState.checked).toBe(true))
      expect(store.libraryState).toMatchObject({ synced: false, feedLoading: true })
    } finally {
      release()
      await refresh
    }
    expect(store.libraryState).toMatchObject({ synced: true, feedLoading: false, error: null })
  })
})

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

  it('offers the prepared October words and sends their version when enabled', async () => {
    const service = fakeService({ enabled: false })
    store.setLibraryClient(service.client())
    Object.assign(store.libraryState, { checked: true, promiseVersion: '2026-10-13' })
    expect(store.libraryStatus().promise).toMatchObject({ version: '2026-10-13' })
    expect(store.libraryStatus().promise?.summary).toContain('Your public name comes from the name you choose in Control.')
    await store.turnLibraryOn('2026-10-13')
    expect(service.calls[0]).toMatchObject({ path: '/v1/library/consent', body: { promise_version: '2026-10-13' } })
    expect(store.libraryState).toMatchObject({ enabled: true, synced: true })
    expect(service.calls.some(call => call.path.startsWith('/v1/items?since='))).toBe(true)
  })

  it('refuses unknown or stale consent before any request is sent', async () => {
    const service = fakeService({ enabled: false })
    store.setLibraryClient(service.client())
    Object.assign(store.libraryState, { checked: true, promiseVersion: '2099-01-01' })
    await expect(store.turnLibraryOn('2099-01-01')).rejects.toMatchObject({ code: 'promise_changed' })
    Object.assign(store.libraryState, { promiseVersion: '2026-10-13' })
    await expect(store.turnLibraryOn('2026-09-26')).rejects.toMatchObject({ code: 'promise_changed' })
    expect(service.calls).toEqual([])
  })

  it('refuses a slicer consent for words other than the current service promise', async () => {
    const service = fakeService({ enabled: false })
    store.setLibraryClient(service.client())
    Object.assign(store.libraryState, { checked: true, promiseVersion: '2026-10-13' })
    await expect(store.saveFromSlicer({ item: null, name: 'Cube', origin: 'save', consent: '2026-09-26', project: new ArrayBuffer(1), outputs: [], thumbnail: null, summary: {} }))
      .rejects.toMatchObject({ code: 'promise_changed' })
    expect(service.calls).toEqual([])
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
