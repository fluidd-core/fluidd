import { afterEach, describe, expect, it, vi } from 'vitest'
import { confirmAccount } from '../confirmation'
import { usePasskey } from '../webauthn'
vi.mock('../webauthn', () => ({ usePasskey: vi.fn() }))
afterEach(() => { vi.unstubAllGlobals(); vi.resetAllMocks(); localStorage.clear() })
describe('ordinary passkey confirmation', () => {
  it('uses the existing session ceremony without a staff purpose or a token swap', async () => {
    localStorage.setItem('muon.cloud.token', 'access-fixture')
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ ceremony_id: 'fixture', expires_at: Math.floor(Date.now() / 1000) + 300, options: { publicKey: { challenge: 'fixture' } } }))).mockResolvedValueOnce(new Response('{}'))
    vi.stubGlobal('fetch', fetcher); vi.mocked(usePasskey).mockResolvedValueOnce({ id: 'credential' } as any)
    await confirmAccount()
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(String(fetcher.mock.calls[0][0])).toMatch(/\/v1\/me\/reauth\/passkey\/options$/)
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({})
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ ceremony_id: 'fixture', credential: { id: 'credential' } })
    expect(fetcher.mock.calls[1][1].headers.authorization).toBe('Bearer access-fixture')
    expect(localStorage.getItem('muon.cloud.token')).toBe('access-fixture')
  })
  it('sends no credential after the session changes during the browser ceremony', async () => {
    localStorage.setItem('muon.cloud.token', 'old-fixture')
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ ceremony_id: 'fixture', expires_at: Math.floor(Date.now() / 1000) + 300, options: { publicKey: {} } })))
    vi.stubGlobal('fetch', fetcher)
    vi.mocked(usePasskey).mockImplementationOnce(async () => { localStorage.setItem('muon.cloud.token', 'new-fixture'); return {} as any })
    await expect(confirmAccount()).rejects.toThrow('account changed')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
