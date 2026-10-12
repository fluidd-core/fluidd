import type { ForeignCredentials, ForeignKind, ForeignPrinterRecord, FormFactor } from './types'

const DB_NAME = 'muon3d-foreign-printers'
const DB_VERSION = 1
const SESSION_PREFIX = 'muon3d.foreign.secret.'

interface StoredSecret {
  ref: string
  iv: Uint8Array
  data: ArrayBuffer
}

type StoredKey = { id: 'main', key: CryptoKey }

let database: Promise<IDBDatabase> | null = null

function openDatabase (): Promise<IDBDatabase> {
  if (database) return database
  database = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('printers')) db.createObjectStore('printers', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('secrets')) db.createObjectStore('secrets', { keyPath: 'ref' })
      if (!db.objectStoreNames.contains('keys')) db.createObjectStore('keys', { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return database
}

function requestValue<T> (request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function encryptionKey (db: IDBDatabase): Promise<CryptoKey> {
  const store = db.transaction('keys', 'readonly').objectStore('keys')
  const stored = await requestValue(store.get('main')) as StoredKey | undefined
  if (stored) return stored.key
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  const tx = db.transaction('keys', 'readwrite')
  tx.objectStore('keys').put({ id: 'main', key } satisfies StoredKey)
  await transactionDone(tx)
  return key
}

function transactionDone (tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
  })
}

const hasCredentials = (credentials: ForeignCredentials | null): credentials is ForeignCredentials =>
  !!credentials && Object.values(credentials).some(Boolean)

export async function listForeign (): Promise<ForeignPrinterRecord[]> {
  const db = await openDatabase()
  return await requestValue(db.transaction('printers', 'readonly').objectStore('printers').getAll()) as ForeignPrinterRecord[]
}

export async function saveForeign (
  rec: Omit<ForeignPrinterRecord, 'id' | 'addedAt' | 'credentialsRef'> & { id?: string },
  creds: ForeignCredentials | null,
  opts: { remember: boolean }
): Promise<ForeignPrinterRecord> {
  const db = await openDatabase()
  const id = rec.id ?? crypto.randomUUID()
  const credentialsRef = hasCredentials(creds) ? crypto.randomUUID() : null
  const record: ForeignPrinterRecord = { ...rec, id, addedAt: Date.now(), credentialsRef }
  if (credentialsRef && creds) {
    if (opts.remember) {
      const key = await encryptionKey(db)
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(creds)))
      const tx = db.transaction('secrets', 'readwrite')
      tx.objectStore('secrets').put({ ref: credentialsRef, iv, data } satisfies StoredSecret)
      await transactionDone(tx)
    } else {
      sessionStorage.setItem(`${SESSION_PREFIX}${credentialsRef}`, JSON.stringify(creds))
    }
  }
  const tx = db.transaction('printers', 'readwrite')
  tx.objectStore('printers').put(record)
  await transactionDone(tx)
  return record
}

export async function updateForeign (id: string, patch: Partial<ForeignPrinterRecord>): Promise<void> {
  const db = await openDatabase()
  const tx = db.transaction('printers', 'readwrite')
  const store = tx.objectStore('printers')
  const record = await requestValue(store.get(id)) as ForeignPrinterRecord | undefined
  if (record) store.put({ ...record, ...patch, id })
  await transactionDone(tx)
}

export async function getCredentials (ref: string | null): Promise<ForeignCredentials | null> {
  if (!ref) return null
  const db = await openDatabase()
  const secret = await requestValue(db.transaction('secrets', 'readonly').objectStore('secrets').get(ref)) as StoredSecret | undefined
  if (secret) {
    const stored = await requestValue(db.transaction('keys', 'readonly').objectStore('keys').get('main')) as StoredKey | undefined
    if (!stored) return null
    const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: secret.iv }, stored.key, secret.data)
    return JSON.parse(new TextDecoder().decode(clear)) as ForeignCredentials
  }
  const value = sessionStorage.getItem(`${SESSION_PREFIX}${ref}`)
  return value ? JSON.parse(value) as ForeignCredentials : null
}

export async function forgetForeign (id: string): Promise<void> {
  const db = await openDatabase()
  const tx = db.transaction(['printers', 'secrets', 'keys'], 'readwrite')
  const printers = tx.objectStore('printers')
  const secrets = tx.objectStore('secrets')
  const keys = tx.objectStore('keys')
  const record = await requestValue(printers.get(id)) as ForeignPrinterRecord | undefined
  printers.delete(id)
  if (record?.credentialsRef) {
    secrets.delete(record.credentialsRef)
    sessionStorage.removeItem(`${SESSION_PREFIX}${record.credentialsRef}`)
  }
  const remaining = await requestValue(secrets.getAll()) as StoredSecret[]
  if (!remaining.length) keys.delete('main')
  await transactionDone(tx)
}

export type ForeignRecordInput = Omit<ForeignPrinterRecord, 'id' | 'addedAt' | 'credentialsRef'> & {
  id?: string
  kind: ForeignKind
  formFactor: FormFactor
}
