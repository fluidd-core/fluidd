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
