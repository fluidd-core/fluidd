import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { adminAvailable, confirmStaff, lookupAccount, readAudit } from '../client'
import { TOKEN_KEY } from '@/services/muon-cloud/api'

const response = (value: unknown, status = 200) => ({ ok: status === 200, status, text: async () => JSON.stringify(value) })
beforeEach(() => {
  vi.stubGlobal('location', new URL('https://control.muon3d.com/admin'))
  localStorage.setItem(TOKEN_KEY, 'ordinary-session')
})
afterEach(() => { localStorage.clear(); vi.unstubAllGlobals() })

describe('staff requests', () => {
  it('completes the staff-purpose ceremony before opening a staff session', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(response({ ceremony_id: 'bound', options: { publicKey: { challenge: 'YQ', userVerification: 'required' } }, expires_at: Date.now() / 1000 + 60 }))
      .mockResolvedValueOnce(response({ ok: true }))
      .mockResolvedValueOnce(response({ actor: 'staff', staff_expires_at: 300 }))
    vi.stubGlobal('fetch', fetch)
    vi.stubGlobal('navigator', { credentials: { get: async () => ({ id: 'YQ', rawId: new Uint8Array([1]).buffer, type: 'public-key', response: { clientDataJSON: new Uint8Array([1]).buffer, authenticatorData: new Uint8Array([1]).buffer, signature: new Uint8Array([1]).buffer } }) } })
    expect(await confirmStaff()).toEqual({ actor: 'staff', staff_expires_at: 300 })
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ purpose: 'staff' })
    expect(fetch.mock.calls.map(c => c[0])).toEqual([
      'https://control.muon3d.com/v1/me/reauth/passkey/options',
      'https://control.muon3d.com/v1/me/reauth/passkey',
      'https://control.muon3d.com/v1/admin/session'
    ])
    expect(JSON.parse(fetch.mock.calls[1][1].body).ceremony_id).toBe('bound')
  })
  it('runs only on the hosted console, never public Library or a printer', () => {
    expect(adminAvailable('https://control.muon3d.com/admin', 'https://control.muon3d.com')).toBe(true)
    expect(adminAvailable('https://app.muon3d.com/admin', 'https://app.muon3d.com')).toBe(true)
    for (const page of ['http://m1.local/admin', 'https://library.muon3d.com/admin', 'https://slicer.muon3d.com/admin']) {
      expect(adminAvailable(page, 'https://control.muon3d.com')).toBe(false)
    }
  })
  it('keeps exact lookup and reason out of the URL and does not broaden results', async () => {
    const fetch = vi.fn().mockResolvedValue(response({ account: null, staff_expires_at: 300 }))
    vi.stubGlobal('fetch', fetch)
    expect(await lookupAccount('person@example.test', 'Review case 1042')).toEqual({ account: null, staff_expires_at: 300 })
    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe('https://control.muon3d.com/v1/admin/accounts/lookup')
    expect(JSON.parse(options.body)).toEqual({ query: 'person@example.test', reason: 'Review case 1042' })
    expect(options.cache).toBe('no-store')
    expect(options.redirect).toBe('error')
  })
  it('cancelled and expired passkeys never complete or mint staff authority', async () => {
    const fetch = vi.fn().mockResolvedValue(response({ ceremony_id: 'once', options: { publicKey: { challenge: 'YQ' } }, expires_at: Date.now() / 1000 + 60 }))
    vi.stubGlobal('fetch', fetch)
    vi.stubGlobal('navigator', { credentials: { get: async () => { throw new DOMException('Cancelled', 'NotAllowedError') } } })
    await expect(confirmStaff()).rejects.toMatchObject({ name: 'NotAllowedError' })
    expect(fetch.mock.calls.map(c => c[0])).toEqual(['https://control.muon3d.com/v1/me/reauth/passkey/options'])
    fetch.mockResolvedValueOnce(response({ ceremony_id: 'old', options: { publicKey: {} }, expires_at: 1 }))
    await expect(confirmStaff()).rejects.toThrow('expired')
  })
  it('uses a models proof for one request without persisting it', async () => {
    const before = JSON.stringify(localStorage)
    const fetch = vi.fn().mockResolvedValueOnce(response({ assertion: 'staff-proof', expires_at: Date.now() / 1000 + 30 }))
      .mockResolvedValueOnce(response({ entries: [], next: null }))
    vi.stubGlobal('fetch', fetch)
    expect(await readAudit('community', null, 'Review case 1042')).toEqual({ entries: [], next: null })
    expect(fetch.mock.calls[1][0]).toBe('https://models.muon3d.com/v1/admin/audit/read')
    expect(fetch.mock.calls[1][1].headers.authorization).toBe('Bearer staff-proof')
    expect(JSON.stringify(localStorage)).toBe(before)
    expect(JSON.stringify(fetch.mock.calls.map(c => c[0]))).not.toContain('staff-proof')
  })
})
