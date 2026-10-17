import { afterEach, describe, expect, it, vi } from 'vitest'
import { exportLibrary } from '../export'
vi.mock('../assertion', () => ({ modelsAssertion: { get: async () => 'models-fixture', drop: vi.fn() } }))
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear() })
function archive () { const bytes = new Uint8Array(2048); bytes.set(new TextEncoder().encode('ustar'), 257); bytes[512] = 123; return bytes }
describe('Library export transport', () => {
  it('uses only a models assertion and closes the chosen file after a complete archive', async () => {
    localStorage.setItem('muon.cloud.token', 'console-fixture')
    const writer = { write: vi.fn().mockResolvedValue(undefined), close: vi.fn().mockResolvedValue(undefined), abort: vi.fn().mockResolvedValue(undefined) }
    vi.stubGlobal('showSaveFilePicker', async () => ({ createWritable: async () => writer }))
    const fetcher = vi.fn().mockResolvedValue(new Response(archive(), { headers: { 'content-type': 'application/x-tar' } })); vi.stubGlobal('fetch', fetcher)
    expect(await exportLibrary(new AbortController().signal)).toBeNull()
    expect(fetcher.mock.calls[0][1]).toMatchObject({ headers: { authorization: 'Bearer models-fixture' }, credentials: 'omit', redirect: 'error', cache: 'no-store' })
    expect(writer.close).toHaveBeenCalledTimes(1); expect(writer.abort).not.toHaveBeenCalled()
  })
  it('aborts the file on a truncated archive and never reports a saved file', async () => {
    localStorage.setItem('muon.cloud.token', 'console-fixture')
    const writer = { write: vi.fn().mockResolvedValue(undefined), close: vi.fn().mockResolvedValue(undefined), abort: vi.fn().mockResolvedValue(undefined) }; vi.stubGlobal('showSaveFilePicker', async () => ({ createWritable: async () => writer }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(archive().slice(0, 900), { headers: { 'content-type': 'application/x-tar' } })))
    await expect(exportLibrary(new AbortController().signal)).rejects.toThrow('incomplete')
    expect(writer.close).not.toHaveBeenCalled(); expect(writer.abort).toHaveBeenCalledTimes(1)
  })
  it('does not start a request after cancellation in the save picker', async () => {
    localStorage.setItem('muon.cloud.token', 'console-fixture')
    vi.stubGlobal('showSaveFilePicker', async () => { throw new DOMException('Cancelled', 'AbortError') }); const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher)
    await expect(exportLibrary(new AbortController().signal)).rejects.toThrow('Cancelled'); expect(fetcher).not.toHaveBeenCalled()
  })
})
