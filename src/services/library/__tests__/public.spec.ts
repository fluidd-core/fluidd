import { describe, expect, it, vi } from 'vitest'
import { createLibraryClient, type PublicPublication } from '../api'

// The model service's GET /v1/public/publications/:id lists each file as
// {id, role, format, encoding, size_bytes, sha256, setup}; sha256 is of the bytes as stored and served
// (the gzip bytes when encoding is "gzip").
const publication: PublicPublication = {
  title: 'Community bracket',
  version: 4,
  files: [{
    id: 'gcode/one',
    role: 'gcode',
    format: 'gcode',
    encoding: 'gzip',
    size_bytes: 42,
    sha256: 'a'.repeat(64),
    setup: { printer_model: 'Muon3D M1', nozzle_mm: 0.4, material: 'PLA' }
  }]
}
const assertion = () => ({ get: vi.fn().mockResolvedValue('console-assertion'), drop: vi.fn() })

describe('public Library hand-off API', () => {
  it('reads the public metadata with a GET', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(publication)))
    const client = createLibraryClient({ baseUrl: 'https://models.invalid', assertion: assertion(), fetch: fetcher })
    await expect(client.publicPublication('share/one')).resolves.toEqual(publication)
    expect(fetcher).toHaveBeenCalledWith('https://models.invalid/v1/public/publications/share%2Fone', expect.objectContaining({ method: 'GET', headers: { authorization: 'Bearer console-assertion' } }))
  })

  // The model service's handler takes `{key?}` (deny_unknown_fields) and answers the raw bytes.
  it('POSTs the share-file request body and returns the raw response bytes', async () => {
    const served = new Uint8Array([0x1f, 0x8b, 0, 255, 1, 2, 3])
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(served, { headers: { 'content-type': 'application/octet-stream' } }))
    const client = createLibraryClient({ baseUrl: 'https://models.invalid', assertion: assertion(), fetch: fetcher })
    const bytes = await client.shareFile('share/one', 'gcode/one')
    expect(bytes).toEqual(served)
    expect(fetcher).toHaveBeenCalledTimes(1)
    const [url, init] = fetcher.mock.calls[0]
    expect(url).toBe('https://models.invalid/v1/shares/share%2Fone/files/gcode%2Fone')
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ 'content-type': 'application/json', authorization: 'Bearer console-assertion' })
    expect(JSON.parse(init.body)).toEqual({})
  })

  it('sends the link key when there is one', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(new Uint8Array([1])))
    const client = createLibraryClient({ baseUrl: 'https://models.invalid', assertion: assertion(), fetch: fetcher })
    await client.shareFile('s', 'f', 'secret')
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ key: 'secret' })
  })

  it('reads a JSON refusal from the share-file route into a LibraryError', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'not_found', message: 'Not found' } }), { status: 404 }))
    const client = createLibraryClient({ baseUrl: 'https://models.invalid', assertion: assertion(), fetch: fetcher })
    await expect(client.shareFile('s', 'f')).rejects.toMatchObject({ code: 'not_found', status: 404 })
  })
})
