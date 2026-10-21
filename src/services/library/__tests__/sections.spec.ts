/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest'
import { createLibraryClient } from '../api'

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

describe('Library sections client', () => {
  it('reads counts, printed runs, sliced items and saved items with an assertion', async () => {
    const fetchSpy = vi.fn(async (...args: Parameters<typeof fetch>) => {
      const input = args[0]
      const path = new URL(String(input)).pathname
      if (path.endsWith('/sections')) return response({ all: 8, printed: 5, sliced: 2, saved: 1, uploads: 0, imported: 0, designs: 0 })
      if (path.endsWith('/runs')) return response({ runs: [{ id: 'run-1', outcome: 'finished' }] })
      return response({ items: [{ id: path.endsWith('/saves') ? 'saved' : 'sliced' }] })
    })
    const fetcher = fetchSpy as unknown as typeof fetch
    const client = createLibraryClient({
      baseUrl: 'https://models.example',
      assertion: { get: async () => 'assertion', drop: () => {} },
      fetch: fetcher
    })

    await expect(client.sections()).resolves.toMatchObject({ all: 8, printed: 5, sliced: 2, saved: 1 })
    await expect(client.runs('next page', 20)).resolves.toMatchObject({ runs: [{ id: 'run-1', outcome: 'finished' }] })
    await expect(client.sliced()).resolves.toMatchObject({ items: [{ id: 'sliced' }] })
    await expect(client.saved()).resolves.toMatchObject({ items: [{ id: 'saved' }] })

    expect(fetchSpy.mock.calls.map(call => String(call[0]))).toEqual([
      'https://models.example/v1/library/sections',
      'https://models.example/v1/library/runs?cursor=next%20page&limit=20',
      'https://models.example/v1/items?origin=slice',
      'https://models.example/v1/community/saves'
    ])
    expect(fetchSpy.mock.calls.every(call => (call[1]?.headers as Record<string, string>).authorization === 'Bearer assertion')).toBe(true)
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
