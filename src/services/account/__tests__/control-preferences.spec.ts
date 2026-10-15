import { afterEach, describe, expect, it, vi } from 'vitest'
import { controlPreferenceRemote } from '../control-preferences'

const context = { accountId: 'alice', token: 'alice-session', printerId: 'printer-stable-1' }
describe('Control account contract', () => {
  afterEach(() => { vi.unstubAllGlobals(); localStorage.clear() })

  it('uses the dedicated versioned API and the captured session rather than another signed-in person', async () => {
    localStorage.setItem('muon.cloud.token', 'bob-session')
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ version: 1, folds: { 'heat.other': true } }), { status: 200 }))
    vi.stubGlobal('fetch', fetcher)
    expect(await controlPreferenceRemote.patch(context, { 'heat.other': true })).toEqual({ version: 1, folds: { 'heat.other': true } })
    const [url, init] = fetcher.mock.calls[0]
    expect(url).toContain('/v1/me/control-preferences/printer-stable-1')
    expect(init.method).toBe('PATCH')
    expect(init.headers.authorization).toBe('Bearer alice-session')
    expect(JSON.parse(init.body)).toEqual({ version: 1, folds: { 'heat.other': true } })
  })

  it('never retries an expired old session using the current person’s credentials', async () => {
    localStorage.setItem('muon.cloud.token', 'bob-session')
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'sign in again' }), { status: 401 }))
    vi.stubGlobal('fetch', fetcher)
    await expect(controlPreferenceRemote.read(context)).rejects.toThrow()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
