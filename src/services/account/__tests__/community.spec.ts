import { afterEach, describe, expect, it, vi } from 'vitest'
import { communityApi } from '../community'
const assertion = vi.hoisted(() => ({ get: vi.fn(async () => 'models-proof'), drop: vi.fn() }))
vi.mock('@/services/library/assertion', () => ({ modelsAssertion: assertion }))
describe('community credential and field boundary', () => {
  afterEach(() => { vi.unstubAllGlobals(); localStorage.clear() })
  it('sends a service proof and just a handle to models, without console credentials or age', async () => {
    localStorage.setItem('muon.cloud.token', 'private-console-session')
    const fetch = vi.fn(async () => new Response(JSON.stringify({ handle: 'ada' }), { status: 200 }))
    vi.stubGlobal('fetch', fetch)
    await communityApi.claim('ada')
    const [url, request] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://models.muon3d.com/v1/community/profile/handle')
    expect(request.credentials).toBe('omit')
    expect(request.headers).toMatchObject({ authorization: 'Bearer models-proof' })
    expect(JSON.parse(request.body as string)).toEqual({ handle: 'ada' })
    expect(JSON.stringify(request)).not.toContain('private-console-session')
  })
  it('keeps the private declaration on the console origin and preserves refusals', async () => {
    localStorage.setItem('muon.cloud.url', 'https://control.test')
    const fetch = vi.fn(async () => new Response(JSON.stringify({ error: 'age was already declared' }), { status: 409 }))
    vi.stubGlobal('fetch', fetch)
    await expect(communityApi.saveIdentity({ declared_age: 18 })).rejects.toThrow('already declared')
    const [url, request] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://control.test/v1/me/community-identity')
    expect(JSON.parse(request.body as string)).toEqual({ declared_age: 18 })
  })
})
