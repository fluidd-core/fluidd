// @vitest-environment node
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { forgetForeign, getCredentials, listForeign, saveForeign } from '../store'

const record = {
  kind: 'octoprint' as const,
  name: 'Octo',
  host: '192.168.1.5',
  via: 'direct' as const,
  formFactor: 'bed-slinger' as const
}

const session = new Map<string, string>()

beforeEach(() => {
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => session.get(key) ?? null,
    setItem: (key: string, value: string) => session.set(key, value),
    removeItem: (key: string) => session.delete(key),
    clear: () => session.clear()
  })
})

afterEach(async () => {
  for (const printer of await listForeign()) await forgetForeign(printer.id)
  sessionStorage.clear()
  vi.unstubAllGlobals()
})

describe('foreign printer credentials', () => {
  it('supports session credentials on a plain HTTP origin without randomUUID or SubtleCrypto', async () => {
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) })
    const saved = await saveForeign(record, { apiKey: 'session-only' }, { remember: false })
    expect(saved.id).toMatch(/^[a-f0-9-]{36}$/)
    await expect(getCredentials(saved.credentialsRef)).resolves.toEqual({ apiKey: 'session-only' })
  })

  it('explains why an insecure origin cannot remember encrypted keys', async () => {
    vi.stubGlobal('crypto', { randomUUID: crypto.randomUUID.bind(crypto), getRandomValues: crypto.getRandomValues.bind(crypto) })
    await expect(saveForeign(record, { apiKey: 'remembered' }, { remember: true })).rejects.toThrow(/HTTPS/)
    expect(await listForeign()).toEqual([])
  })

  it.each(['8.8.8.8', 'printer.example.com', '192.168.1.5@evil.example', '192.168.1.5/path'])('rejects non-local or malformed address %s before saving credentials', async host => {
    await expect(saveForeign({ ...record, host }, { apiKey: 'local-only' }, { remember: false })).rejects.toThrow()
    expect(await listForeign()).toEqual([])
    expect(session.size).toBe(0)
  })

  it('can decrypt both printers after concurrent first remembered saves', async () => {
    const saved = await Promise.all([
      saveForeign(record, { apiKey: 'key-one' }, { remember: true }),
      saveForeign({ ...record, host: '192.168.1.6' }, { apiKey: 'key-two' }, { remember: true })
    ])
    await expect(getCredentials(saved[0].credentialsRef)).resolves.toEqual({ apiKey: 'key-one' })
    await expect(getCredentials(saved[1].credentialsRef)).resolves.toEqual({ apiKey: 'key-two' })
  })

  it('removes the old remembered secret when replacing credentials, then forgets everything', async () => {
    const first = await saveForeign(record, { apiKey: 'old-key' }, { remember: true })
    const replacement = await saveForeign({ ...record, id: first.id }, { apiKey: 'new-key' }, { remember: false })
    await expect(getCredentials(first.credentialsRef)).resolves.toBeNull()
    await expect(getCredentials(replacement.credentialsRef)).resolves.toEqual({ apiKey: 'new-key' })
    await forgetForeign(first.id)
    await expect(getCredentials(replacement.credentialsRef)).resolves.toBeNull()
    const db = await new Promise<IDBDatabase>(resolve => {
      const request = indexedDB.open('muon3d-foreign-printers', 1)
      request.onsuccess = () => resolve(request.result)
    })
    for (const name of ['printers', 'secrets', 'keys']) {
      const count = await new Promise<number>(resolve => {
        const request = db.transaction(name).objectStore(name).count()
        request.onsuccess = () => resolve(request.result)
      })
      expect(count).toBe(0)
    }
    db.close()
  })

  it('encrypts remembered credentials with a non-extractable IndexedDB key', async () => {
    const saved = await saveForeign(record, { apiKey: 'secret-value' }, { remember: true })
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('muon3d-foreign-printers', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const secret = await new Promise<any>(resolve => {
      const request = db.transaction('secrets').objectStore('secrets').get(saved.credentialsRef!)
      request.onsuccess = () => resolve(request.result)
    })
    const key = await new Promise<CryptoKey>(resolve => {
      const request = db.transaction('keys').objectStore('keys').get('main')
      request.onsuccess = () => resolve(request.result.key)
    })
    expect(new TextDecoder().decode(secret.data)).not.toContain('secret-value')
    await expect(crypto.subtle.exportKey('raw', key)).rejects.toThrow()
    await expect(getCredentials(saved.credentialsRef)).resolves.toEqual({ apiKey: 'secret-value' })
    db.close()
  })

  it('keeps unremembered credentials in session storage only and removes them when forgotten', async () => {
    const saved = await saveForeign(record, { apiKey: 'session-key' }, { remember: false })
    expect(sessionStorage.getItem(`muon3d.foreign.secret.${saved.credentialsRef}`)).toContain('session-key')
    const db = await new Promise<IDBDatabase>(resolve => {
      const request = indexedDB.open('muon3d-foreign-printers', 1)
      request.onsuccess = () => resolve(request.result)
    })
    const secrets = await new Promise<any[]>(resolve => {
      const request = db.transaction('secrets').objectStore('secrets').getAll()
      request.onsuccess = () => resolve(request.result)
    })
    expect(secrets).toHaveLength(0)
    await forgetForeign(saved.id)
    expect(await listForeign()).toEqual([])
    expect(sessionStorage.getItem(`muon3d.foreign.secret.${saved.credentialsRef}`)).toBeNull()
    db.close()
  })
})
