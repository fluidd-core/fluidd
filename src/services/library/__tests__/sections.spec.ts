/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest'
import { createLibraryClient, savedRows } from '../api'

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

describe('Library sections client', () => {
  it('reads counts, printed runs, sliced items and saved items with an assertion', async () => {
    const item = {
      id: 'item-1',
      kind: 'print',
      format: '3mf',
      name: 'Bracket',
      size_bytes: 42,
      has_thumbnail: false,
      state: 'ready',
      rev: 3,
      created_at: '2026-10-20T10:00:00Z',
      updated_at: '2026-10-20T10:00:00Z',
      deleted_at: null
    }
    const fetchSpy = vi.fn(async (...args: Parameters<typeof fetch>) => {
      const input = args[0]
      const path = new URL(String(input)).pathname
      if (path.endsWith('/sections')) return response({ all: 8, printed: 5, sliced: 2, saved: 1, uploads: 0, imported: 0, designs: 0 })
      if (path.endsWith('/runs')) {
        return response({
          runs: [{ id: 'run-1', item_id: 'item-1', version: 3, printer_id: 'printer-1', printer_name: 'Workshop', file_name: 'bracket.gcode', started_at: '2026-10-20T11:00:00Z', ended_at: '2026-10-20T12:00:00Z', outcome: 'finished', progress_pct: 100, duration_s: 3600, in_library: true, item }],
          next_cursor: null
        })
      }
      if (path.endsWith('/saves')) {
        return response({
          saves: [{ id: 'save-1', target: { kind: 'model', model_id: 'model-1' }, card: { title: 'Desk hook', thumbnail_url: 'https://cdn.example/hook.png', creator: 'Ada', url: 'https://library.example/models/model-1', available: true }, created_at: '2026-10-20T09:00:00Z' }],
          next_cursor: null
        })
      }
      return response({ items: [item], rev: 3, reset: false, more: false })
    })
    const fetcher = fetchSpy as unknown as typeof fetch
    const client = createLibraryClient({
      baseUrl: 'https://models.example',
      assertion: { get: async () => 'assertion', drop: () => {} },
      fetch: fetcher
    })

    await expect(client.sections()).resolves.toMatchObject({ all: 8, printed: 5, sliced: 2, saved: 1 })
    await expect(client.runs('next page', 20)).resolves.toMatchObject({ runs: [{ id: 'run-1', outcome: 'finished' }] })
    await expect(client.sliced()).resolves.toMatchObject({ items: [{ id: 'item-1' }], rev: 3, reset: false, more: false })
    await expect(client.saved()).resolves.toMatchObject({ saves: [{ id: 'save-1', card: { title: 'Desk hook', available: true } }], next_cursor: null })

    expect(fetchSpy.mock.calls.map(call => String(call[0]))).toEqual([
      'https://models.example/v1/library/sections',
      'https://models.example/v1/library/runs?cursor=next%20page&limit=20',
      'https://models.example/v1/items?origin=slice',
      'https://models.example/v1/community/saves'
    ])
    expect(fetchSpy.mock.calls.every(call => (call[1]?.headers as Record<string, string>).authorization === 'Bearer assertion')).toBe(true)
  })

  it('maps the real saves page, including unavailable targets, and accepts an empty page', () => {
    expect(savedRows({
      saves: [{
        id: 'save-gone',
        target: { kind: 'model', model_id: 'deleted-model' },
        card: { title: 'Retired gear', available: false },
        created_at: '2026-10-20T09:00:00Z'
      }],
      next_cursor: null
    })).toEqual([{ id: 'save-gone', title: 'Retired gear', thumbnailUrl: null, creator: null, url: null, available: false }])
    expect(savedRows({ saves: [], next_cursor: null })).toEqual([])
  })

  it('preserves a saves 404 so Control can hide that tab', async () => {
    const client = createLibraryClient({
      baseUrl: 'https://models.example',
      assertion: { get: async () => 'a', drop: () => {} },
      fetch: async () => response({ error: { code: 'not_found', message: 'Unavailable' } }, 404)
    })
    await expect(client.saved()).rejects.toMatchObject({ status: 404, code: 'not_found' })
  })
})
