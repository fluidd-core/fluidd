import { describe, expect, it, vi } from 'vitest'
import { createLibraryClient, type PublicPublication, type Transfer } from '../api'

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
    setup: { printer_model: 'Muon3D M1', nozzle_mm: 0.4, material: 'PLA' },
    print_seconds: 600,
    filament_g: 12
  }]
}
const transfer: Transfer = { method: 'GET', url: 'https://files.invalid/signed', needs_auth: false, expires_at: '2030-01-01T00:00:00Z' }

describe('public Library hand-off API', () => {
  it('uses the public metadata and signed-in share-file routes with their documented response shapes', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(publication)))
      .mockResolvedValueOnce(new Response(JSON.stringify(transfer)))
    const assertion = { get: vi.fn().mockResolvedValue('console-assertion'), drop: vi.fn() }
    const client = createLibraryClient({ baseUrl: 'https://models.invalid', assertion, fetch: fetcher })

    await expect(client.publicPublication('share/one')).resolves.toEqual(publication)
    await expect(client.shareFileUrl('share/one', 'gcode/one')).resolves.toEqual(transfer)
    expect(fetcher).toHaveBeenNthCalledWith(1, 'https://models.invalid/v1/public/publications/share%2Fone', expect.objectContaining({ method: 'GET', headers: { authorization: 'Bearer console-assertion' } }))
    expect(fetcher).toHaveBeenNthCalledWith(2, 'https://models.invalid/v1/shares/share%2Fone/files/gcode%2Fone', expect.objectContaining({ method: 'POST', headers: { authorization: 'Bearer console-assertion' } }))
  })
})
