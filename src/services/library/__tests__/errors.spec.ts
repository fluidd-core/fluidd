/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest'
import { createLibraryClient, describeLibraryError, LibraryError, libraryErrorFrom } from '../api'
import { consoleAssertion } from '../assertion'
import { saveToLibrary } from '../save'
import { fakeService } from './fakeService'

const consoleError = vi.hoisted(() => {
  class CloudError extends Error {
    constructor (message: string, readonly status: number) { super(message) }
  }
  return { CloudError, assertion: vi.fn() }
})

vi.mock('@/services/muon-cloud/api', () => ({
  cloudApi: { assertion: consoleError.assertion },
  CloudError: consoleError.CloudError,
  storedToken: () => 'session'
}))

const save = {
  item: null,
  name: 'Cube',
  origin: 'save' as const,
  consent: null,
  project: new Uint8Array([1, 2, 3]).buffer,
  outputs: [],
  thumbnail: null,
  summary: {}
}

describe('the Library\'s error codes', () => {
  it('reads the service\'s code and words', () => {
    const quota = libraryErrorFrom(413, { error: { code: 'quota_exceeded', message: '980 MB of 1 GB used.' } })
    expect(quota).toMatchObject({ code: 'quota_exceeded', status: 413, message: '980 MB of 1 GB used.' })
    expect(describeLibraryError(quota)).toBe('Your Library is full. 980 MB of 1 GB used.')
    const consent = libraryErrorFrom(403, { error: { code: 'consent_required', message: 'Off.' } })
    expect(consent.code).toBe('consent_required')
    expect(describeLibraryError(consent)).toBe('Your Library is off. Turn it on in Settings › Library.')
  })

  it('makes any 401 not-signed-in, whatever the body says', () => {
    expect(libraryErrorFrom(401, { error: { code: 'unauthorized', message: 'x' } }).code).toBe('not-signed-in')
    expect(libraryErrorFrom(401, null).code).toBe('not-signed-in')
  })

  it('keeps a status with no body as a code of its own', () => {
    expect(libraryErrorFrom(502, null)).toMatchObject({ code: 'http-502', status: 502 })
  })

  it('a save to a Library that is off is consent_required', async () => {
    const service = fakeService({ enabled: false })
    await expect(saveToLibrary(service.client(), save)).rejects.toMatchObject({ code: 'consent_required', status: 403 })
  })

  it('a save over the quota is quota_exceeded, and nothing is uploaded', async () => {
    const service = fakeService()
    service.queue(/^\/v1\/prints$/, 413, { error: { code: 'quota_exceeded', message: '1 GB of 1 GB used.' } })
    await expect(saveToLibrary(service.client(), save)).rejects.toMatchObject({ code: 'quota_exceeded', status: 413 })
    expect(service.calls.filter(c => c.method === 'PUT')).toHaveLength(0)
  })

  it('a network failure is offline', async () => {
    const down = (async () => { throw new TypeError('Failed to fetch') }) as typeof fetch
    const unreachable = createLibraryClient({ baseUrl: 'https://models.example', assertion: { get: async () => 'a', drop: () => {} }, fetch: down })
    await expect(unreachable.info()).rejects.toMatchObject({ code: 'offline' })
  })

  it('the console\'s 401 for an assertion is not-signed-in; no answer is offline', async () => {
    consoleError.assertion.mockRejectedValueOnce(new consoleError.CloudError('Sign in.', 401))
    await expect(consoleAssertion('https://models.example')).rejects.toMatchObject({ code: 'not-signed-in' })
    consoleError.assertion.mockRejectedValueOnce(new consoleError.CloudError('unreachable', 0))
    await expect(consoleAssertion('https://models.example')).rejects.toMatchObject({ code: 'offline' })
    consoleError.assertion.mockResolvedValueOnce({ assertion: 'x', expires_at: 1 })
    await expect(consoleAssertion('https://models.example')).resolves.toEqual({ assertion: 'x', expires_at: 1 })
    expect(consoleError.assertion).toHaveBeenLastCalledWith('https://models.example')
  })

  it('is a LibraryError', () => {
    expect(libraryErrorFrom(404, null)).toBeInstanceOf(LibraryError)
  })
})
