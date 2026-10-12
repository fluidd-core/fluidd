/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { gunzip, sha256Hex } from '../bytes'
import { saveToLibrary, type SaveRequest } from '../save'
import { fakeService } from './fakeService'

const text = (s: string) => new TextEncoder().encode(s)
const buffer = (s: string) => text(s).buffer as ArrayBuffer

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4])

function request (over: Partial<SaveRequest> = {}): SaveRequest {
  return {
    item: null,
    name: 'Hinge bracket',
    origin: 'save',
    consent: null,
    project: buffer('PK project bytes'),
    outputs: [{
      gcode: buffer('G28\nG1 X10 Y10 E1\n'.repeat(50)),
      name: 'hinge-bracket.gcode',
      setup: { printerModel: 'Muon3D M1', nozzleMm: 0.4, material: 'PLA' },
      printSeconds: 4320.4,
      filamentGrams: 23.5
    }],
    thumbnail: PNG.slice().buffer,
    summary: { layer_height_mm: 0.2, quality: 'Normal' },
    ...over
  }
}

describe('saveToLibrary', () => {
  it('declares, uploads what is asked for, then completes: a new print', async () => {
    const service = fakeService({ presign: true })
    const progress: Array<{ sent: number, total: number }> = []
    const saved = await saveToLibrary(service.client(), request(), p => progress.push(p))

    const order = service.calls.map(c => `${c.method} ${c.path.replace(/[0-9a-f]{64}/, '<sha>')}`)
    expect(order).toEqual([
      'POST /v1/prints',
      'PUT bucket:/<sha>',
      'PUT bucket:/<sha>',
      'PUT bucket:/<sha>',
      'POST /v1/items/item-1/versions/1/complete'
    ])
    const post = service.calls[0].body as { name: string, origin: string, summary: unknown, files: Array<Record<string, any>> }
    expect(post.name).toBe('Hinge bracket')
    expect(post.origin).toBe('save')
    expect(post.summary).toEqual({ layer_height_mm: 0.2, quality: 'Normal' })
    expect(post.files.map(f => [f.role, f.format, f.encoding])).toEqual([
      ['project', '3mf', 'identity'],
      ['gcode', 'gcode', 'gzip'],
      ['thumbnail', 'png', 'identity']
    ])
    const gcode = post.files[1]
    expect(gcode.setup).toEqual({ printer_model: 'Muon3D M1', nozzle_mm: 0.4, material: 'PLA' })
    expect(gcode.print_seconds).toBe(4320)
    expect(gcode.filament_g).toBe(23.5)
    // Stored compressed: the declared size and hash are of the gzip bytes, which unpack to the slicer's G-code.
    const stored = service.stored.get(gcode.sha256)!
    expect(stored.byteLength).toBe(gcode.size_bytes)
    expect(await sha256Hex(stored)).toBe(gcode.sha256)
    expect(new TextDecoder().decode(await gunzip(stored))).toBe('G28\nG1 X10 Y10 E1\n'.repeat(50))
    expect(gcode.size_bytes).toBeLessThan('G28\nG1 X10 Y10 E1\n'.repeat(50).length)
    // A presigned URL carries no bearer.
    expect(service.calls.filter(c => c.method === 'PUT').every(c => c.auth === null)).toBe(true)
    // Progress counts the bytes sent, up to all of them.
    const total = post.files.reduce((sum, f) => sum + f.size_bytes, 0)
    expect(progress[0]).toEqual({ sent: 0, total })
    expect(progress[progress.length - 1]).toEqual({ sent: total, total })
    expect(progress.every((p, i) => i === 0 || p.sent >= progress[i - 1].sent)).toBe(true)
    expect(saved.version.number).toBe(1)
    expect(saved.item.state).toBe('ready')
  })

  it('sends the assertion with a PUT only when the transfer needs it', async () => {
    const service = fakeService({ presign: false })
    await saveToLibrary(service.client(), request())
    const puts = service.calls.filter(c => c.method === 'PUT')
    expect(puts).toHaveLength(3)
    expect(puts.every(c => typeof c.auth === 'string' && c.auth.startsWith('Bearer assertion-'))).toBe(true)
  })

  it('a version of an unchanged project uploads nothing: the service already holds every file', async () => {
    const service = fakeService({ presign: true })
    const first = await saveToLibrary(service.client(), request())
    service.calls.length = 0
    const progress: Array<{ sent: number, total: number }> = []
    const again = await saveToLibrary(service.client(), request({ item: first.item.id, origin: 'autosave' }), p => progress.push(p))

    expect(service.calls.map(c => `${c.method} ${c.path}`)).toEqual([
      `POST /v1/items/${first.item.id}/versions`,
      `POST /v1/items/${first.item.id}/versions/2/complete`
    ])
    // A version has no name of its own: the print keeps its name.
    expect(service.calls[0].body).not.toHaveProperty('name')
    expect((service.calls[0].body as { origin: string }).origin).toBe('autosave')
    expect(progress).toEqual([{ sent: 0, total: 0 }])
    expect(again.version.number).toBe(2)
  })

  it('uploads only the file that changed', async () => {
    const service = fakeService({ presign: true })
    const first = await saveToLibrary(service.client(), request())
    service.calls.length = 0
    await saveToLibrary(service.client(), request({ item: first.item.id, project: buffer('PK a changed project') }))
    expect(service.calls.filter(c => c.method === 'PUT')).toHaveLength(1)
  })

  it('gives the consent first when the person turned the Library on with this save', async () => {
    const service = fakeService({ presign: true, enabled: false })
    await saveToLibrary(service.client(), request({ consent: '2026-09-26', origin: 'card' }))
    expect(service.calls[0]).toMatchObject({ method: 'PUT', path: '/v1/library/consent', body: { promise_version: '2026-09-26' } })
    expect(service.calls[1]).toMatchObject({ method: 'POST', path: '/v1/prints' })
  })

  it('never completes a version whose upload failed', async () => {
    const service = fakeService({ presign: true })
    const client = service.client()
    const failing = { ...client, put: async () => { throw new Error('network') } }
    await expect(saveToLibrary(failing, request())).rejects.toThrow('network')
    expect(service.calls.some(c => c.path.endsWith('/complete'))).toBe(false)
  })
})
