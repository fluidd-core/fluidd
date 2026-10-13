/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cloudApi, CloudError, storeToken } from '../api'
import { accountApi } from '@/services/account/api'
import * as cloud from '../api'
const deleteAfter = () => (cloud as any).deletionState?.deleteAfter ?? null

const response = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })
const refusal = { deletion_pending: true, delete_after: 1800000000 }

describe('deletion refusals across console clients', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    fetchMock.mockReset()
    const saved = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => saved.set(key, value),
      removeItem: (key: string) => saved.delete(key),
      clear: () => saved.clear()
    })
    localStorage.setItem('muon.cloud.url', 'https://console.example.test')
    storeToken('session')
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    storeToken(null)
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it.each(['printers', 'getLayout'] as const)('keeps the deletion date from %s without discarding the session', async route => {
    fetchMock.mockResolvedValueOnce(response(403, refusal))
    const error = await cloudApi[route]().catch(e => e)
    expect(error).toBeInstanceOf(CloudError)
    expect(error.deletionPending).toBe(true)
    expect(error.body.delete_after).toBe(1800000000)
    expect(deleteAfter()).toBe(1800000000)
    expect(localStorage.getItem('muon.cloud.token')).toBe('session')
  })

  it('reads a pending deletion from me before any route refuses', async () => {
    fetchMock.mockResolvedValueOnce(response(200, { account: { id: 'a1', deletion: { requested_at: 1799000000, delete_after: 1800000000 } } }))
    await cloudApi.me()
    expect(deleteAfter()).toBe(1800000000)
  })

  it('clears the pending state only after the console accepts Keep my account', async () => {
    fetchMock.mockResolvedValueOnce(response(403, refusal)).mockResolvedValueOnce(response(500, { error: 'try again' })).mockResolvedValueOnce(response(200, { ok: true, account: { id: 'a1', deletion: null } }))
    await cloudApi.printers().catch(() => {})
    await accountApi.cancelDeletion().catch(() => {})
    expect(deleteAfter()).toBe(1800000000)
    await accountApi.cancelDeletion()
    expect(deleteAfter()).toBe(null)
  })

  it('clears it on sign-out and ignores a late refusal from the old session', async () => {
    fetchMock.mockResolvedValueOnce(response(403, refusal))
    await cloudApi.printers().catch(() => {})
    expect(deleteAfter()).toBe(1800000000)
    let finish!: (value: Response) => void
    fetchMock.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const old = cloudApi.printers().catch(() => {})
    storeToken(null)
    finish(response(403, refusal))
    await old
    expect(deleteAfter()).toBe(null)
  })

  it('ignores an old refusal that arrives after Keep my account succeeds', async () => {
    fetchMock.mockResolvedValueOnce(response(403, refusal))
    await cloudApi.printers().catch(() => {})
    let finish!: (value: Response) => void
    fetchMock.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const old = cloudApi.getLayout().catch(() => {})
    fetchMock.mockResolvedValueOnce(response(200, { ok: true }))
    await accountApi.cancelDeletion()
    expect(deleteAfter()).toBe(null)
    finish(response(403, refusal))
    await old
    expect(deleteAfter()).toBe(null)
  })

  it('does not publish an unrelated 403 or a refusal for a sign-in page token', async () => {
    fetchMock.mockResolvedValueOnce(response(403, { error: 'access denied' })).mockResolvedValueOnce(response(403, refusal))
    await cloudApi.printers().catch(() => {})
    expect(deleteAfter()).toBe(null)
    const { accountRequest } = await import('@/services/account/client')
    await accountRequest('GET', '/v1/me/preferences', undefined, { token: 'other-session' }).catch(() => {})
    expect(deleteAfter()).toBe(null)
  })

  it('shares the same refusal contract with the Account client', async () => {
    fetchMock.mockResolvedValueOnce(response(403, refusal))
    const error = await accountApi.preferences().catch(e => e)
    expect(error.deletionPending).toBe(true)
    expect(error.body.delete_after).toBe(1800000000)
    expect(deleteAfter()).toBe(1800000000)
  })
})
