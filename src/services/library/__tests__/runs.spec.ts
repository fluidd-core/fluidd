import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRun, resetRunReportingForTests } from '../runs'

vi.mock('../assertion', () => ({ modelsAssertion: { get: vi.fn().mockResolvedValue('assertion') } }))

const reply = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }))

describe('Library run reporting', () => {
  beforeEach(() => resetRunReportingForTests())

  it('sends a digest and stable fields with an idempotency key', async () => {
    const fetcher = vi.fn().mockImplementation(() => reply(201, { id: 'run-1' }))
    await createRun({ printer_id: 'p1', printer_name: 'Pine', file_name: 'cube.gcode', bytes: new Uint8Array([1, 2]), item_id: 'item', version: 3 }, fetcher)
    const [, init] = fetcher.mock.calls[0]
    expect(init.headers['Idempotency-Key']).toMatch(/^control:p1:/)
    expect(JSON.parse(init.body)).toMatchObject({ printer_id: 'p1', printer_name: 'Pine', file_name: 'cube.gcode', reporter: 'control', item_id: 'item', version: 3, gcode_sha256: expect.stringMatching(/^[0-9a-f]{64}$/) })
  })

  it('stops permanently for this page after consent_required', async () => {
    const fetcher = vi.fn().mockImplementation(() => reply(403, { error: { code: 'consent_required' } }))
    await createRun({ printer_id: 'p1', printer_name: 'Pine', file_name: 'one.gcode' }, fetcher)
    await createRun({ printer_id: 'p1', printer_name: 'Pine', file_name: 'two.gcode' }, fetcher)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('retries transient failures a bounded number of times', async () => {
    const fetcher = vi.fn().mockImplementation(() => reply(503, {}))
    await createRun({ printer_id: 'p1', printer_name: 'Pine', file_name: 'cube.gcode' }, fetcher)
    expect(fetcher).toHaveBeenCalledTimes(3)
  })
})
