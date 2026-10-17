import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { adminAvailable, confirmStaff, lookupAccount, readAudit, staffCommand, sourceBlob } from '../client'
import { webcrypto } from 'node:crypto'
import { TOKEN_KEY } from '@/services/muon-cloud/api'

const response = (value: unknown, status = 200) => ({ ok: status === 200, status, text: async () => JSON.stringify(value) })
beforeEach(() => {
  vi.stubGlobal('location', new URL('https://control.muon3d.com/admin'))
  localStorage.setItem(TOKEN_KEY, 'ordinary-session')
})
afterEach(() => { localStorage.clear(); vi.unstubAllGlobals() })

describe('staff requests', () => {
  it('refuses changed source bytes and case manifests before a download is exposed', async () => {
    vi.stubGlobal('crypto', webcrypto)
    const file = { id: 'fixture', role: 'project', format: '3mf', encoding: 'identity', size_bytes: 3, sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad' }
    const source = { file, manifest: 'case-snapshot', bytes: 'YWJj' }
    expect((await sourceBlob(source, file, 'case-snapshot')).size).toBe(3)
    await expect(sourceBlob({ ...source, bytes: 'YmFk' }, file, 'case-snapshot')).rejects.toThrow('did not match')
    await expect(sourceBlob(source, file, 'changed-case')).rejects.toThrow('changed')
  })
  it('never automatically retries a mutation and keeps console authority on its origin', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(response({ ceremony_id: 'once', options: { publicKey: { challenge: 'YQ' } }, expires_at: Date.now() / 1000 + 60 }))
      .mockResolvedValueOnce(response({ ok: true })).mockResolvedValueOnce(response({ actor: 'staff', staff_expires_at: Date.now() / 1000 + 120 }))
      .mockRejectedValueOnce(new Error('connection lost'))
    vi.stubGlobal('fetch', fetch)
    vi.stubGlobal('navigator', { credentials: { get: async () => ({ id: 'YQ', rawId: new Uint8Array([1]).buffer, type: 'public-key', response: { clientDataJSON: new Uint8Array([1]).buffer, authenticatorData: new Uint8Array([1]).buffer, signature: new Uint8Array([1]).buffer } }) } })
    const command = { command: '0123456789abcdef0123456789abcdef', action: 'hide', target: 'case-1', version: 3, reason: 'Review unsafe content', details: {} }
    await expect(staffCommand(command)).rejects.toThrow('outcome is uncertain')
    expect(fetch.mock.calls.map(c => c[0])).toEqual([
      'https://control.muon3d.com/v1/me/reauth/passkey/options', 'https://control.muon3d.com/v1/me/reauth/passkey', 'https://control.muon3d.com/v1/admin/session', 'https://control.muon3d.com/v1/admin/community'
    ])
    expect(JSON.parse(fetch.mock.calls[3][1].body)).toEqual(command)
  })
  it('does not refresh or repeat a staff mutation after a 401', async () => {
    localStorage.setItem('muon.cloud.refresh', 'refresh-session')
    const credential = { id: 'YQ', rawId: new Uint8Array([1]).buffer, type: 'public-key', response: { clientDataJSON: new Uint8Array([1]).buffer, authenticatorData: new Uint8Array([1]).buffer, signature: new Uint8Array([1]).buffer } }
    const fetch = vi.fn().mockResolvedValueOnce(response({ ceremony_id: 'once', options: { publicKey: { challenge: 'YQ' } }, expires_at: Date.now() / 1000 + 60 }))
      .mockResolvedValueOnce(response({ ok: true })).mockResolvedValueOnce(response({ actor: 'staff', staff_expires_at: Date.now() / 1000 + 120 }))
      .mockResolvedValueOnce(response({ error: 'confirm staff access again' }, 401))
    vi.stubGlobal('fetch', fetch); vi.stubGlobal('navigator', { credentials: { get: async () => credential } })
    const command = { command: '0123456789abcdef0123456789abcdef', action: 'hide', target: 'case-1', version: 3, reason: 'Review unsafe content', details: {} }
    await expect(staffCommand(command)).rejects.toMatchObject({ status: 401 })
    expect(fetch).toHaveBeenCalledTimes(4)
    expect(fetch.mock.calls.filter(c => c[0] === 'https://control.muon3d.com/v1/admin/community')).toHaveLength(1)
    expect(fetch.mock.calls.some(c => c[0] === 'https://control.muon3d.com/token')).toBe(false)
  })
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
    expect(adminAvailable('https://control.muon3d.com/admin', 'https://control.muon3d.com', true)).toBe(false)
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
