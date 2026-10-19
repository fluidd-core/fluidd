import { afterEach, describe, expect, it, vi } from 'vitest'
import { exportLibrary } from '../export'

const { assertion } = vi.hoisted(() => ({ assertion: { get: vi.fn(async () => 'models-fixture'), drop: vi.fn() } }))
vi.mock('../assertion', () => ({ modelsAssertion: assertion }))
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); vi.clearAllMocks() })
function archive () { const bytes = new Uint8Array(2048); bytes.set(new TextEncoder().encode('ustar'), 257); bytes[512] = 123; return bytes }
function signedIn () { localStorage.setItem('muon.cloud.token', 'console-fixture') }
function writer () { return { write: vi.fn().mockResolvedValue(undefined), close: vi.fn().mockResolvedValue(undefined), abort: vi.fn().mockResolvedValue(undefined) } }
function response (body: BodyInit | null, init: ResponseInit = {}) { return new Response(body, { ...init, headers: { 'content-type': 'application/x-tar', ...init.headers } }) }

describe('Library export transport', () => {
  it('uses only a models assertion and closes a chosen file only after verification', async () => {
    signedIn(); const file = writer(); vi.stubGlobal('showSaveFilePicker', async () => ({ createWritable: async () => file }))
    const fetcher = vi.fn().mockResolvedValue(response(archive())); vi.stubGlobal('fetch', fetcher)
    expect(await exportLibrary(new AbortController().signal)).toBeNull()
    expect(fetcher.mock.calls[0][1]).toMatchObject({ headers: { authorization: 'Bearer models-fixture' }, credentials: 'omit', redirect: 'error', cache: 'no-store' })
    expect(file.close).toHaveBeenCalledOnce(); expect(file.abort).not.toHaveBeenCalled()
  })
  it('does not request an archive when the user cancels the picker', async () => {
    signedIn(); vi.stubGlobal('showSaveFilePicker', async () => { throw new DOMException('Cancelled', 'AbortError') }); const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher)
    await expect(exportLibrary(new AbortController().signal)).rejects.toMatchObject({ name: 'AbortError' }); expect(fetcher).not.toHaveBeenCalled()
  })
  it('aborts rather than closes a chosen file when the response stream errors', async () => {
    signedIn(); const file = writer(); vi.stubGlobal('showSaveFilePicker', async () => ({ createWritable: async () => file }))
    const body = new ReadableStream({ start (c) { c.enqueue(archive().slice(0, 512)); c.error(new Error('network lost')) } }); vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(body)))
    await expect(exportLibrary(new AbortController().signal)).rejects.toThrow('network lost'); expect(file.abort).toHaveBeenCalledOnce(); expect(file.close).not.toHaveBeenCalled()
  })
  it('rejects a buffering stream error without producing a Blob', async () => {
    signedIn(); vi.stubGlobal('showSaveFilePicker', undefined)
    const body = new ReadableStream({ start (c) { c.enqueue(archive().slice(0, 512)); c.error(new Error('network lost')) } }); vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(body)))
    await expect(exportLibrary(new AbortController().signal)).rejects.toThrow('network lost')
  })
  it('rejects a server body that ends before the zero trailer', async () => {
    signedIn(); vi.stubGlobal('showSaveFilePicker', undefined); vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(archive().slice(0, 1024))))
    await expect(exportLibrary(new AbortController().signal)).rejects.toThrow('incomplete')
  })
  it('rejects a full-sized archive whose tar trailer is not zero-filled', async () => {
    signedIn(); vi.stubGlobal('showSaveFilePicker', undefined)
    const bytes = archive(); bytes[1024] = 1
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(bytes)))
    await expect(exportLibrary(new AbortController().signal)).rejects.toThrow('incomplete')
  })
  it.each([[401, 'session ended'], [404, 'No Library archive'], [409, 'Library changed'], [429, 'Too many archive requests']])('gives HTTP %i its own useful message', async (status, message) => {
    signedIn(); vi.stubGlobal('showSaveFilePicker', undefined); vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response('{}', { status })))
    await expect(exportLibrary(new AbortController().signal)).rejects.toThrow(message); if (status === 401) expect(assertion.drop).toHaveBeenCalledOnce()
  })
  it('allows exactly 128 MiB but rejects one byte over in fallback mode', async () => {
    signedIn(); vi.stubGlobal('showSaveFilePicker', undefined); const limit = 128 * 1024 * 1024
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(archive(), { headers: { 'content-length': String(limit) } }))); expect(await exportLibrary(new AbortController().signal)).toBeInstanceOf(Blob)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(archive(), { headers: { 'content-length': String(limit + 1) } }))); await expect(exportLibrary(new AbortController().signal)).rejects.toThrow('up to 128 MiB')
  })
  it('aborts if the account changes between stream chunks', async () => {
    signedIn(); const file = writer(); file.write.mockImplementation(async () => { localStorage.setItem('muon.cloud.token', 'another-account') }); vi.stubGlobal('showSaveFilePicker', async () => ({ createWritable: async () => file }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(archive())))
    await expect(exportLibrary(new AbortController().signal)).rejects.toThrow('account changed'); expect(file.abort).toHaveBeenCalledOnce(); expect(file.close).not.toHaveBeenCalled()
  })
  it('works without the File System Access API and reports progress', async () => {
    signedIn(); vi.stubGlobal('showSaveFilePicker', undefined); const progress = vi.fn(); vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(archive(), { headers: { 'content-length': '2048' } })))
    const result = await exportLibrary(new AbortController().signal, progress); expect(result).toBeInstanceOf(Blob); expect(result?.size).toBe(2048); expect(progress).toHaveBeenLastCalledWith(2048, 2048)
  })
})
