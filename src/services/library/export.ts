import { modelsAssertion } from './assertion'
import { libraryErrorFrom, MODELS_URL } from './api'
import { storedToken } from '@/services/muon-cloud/api'

interface Writer { write (chunk: Uint8Array): Promise<void>; close (): Promise<void>; abort (): Promise<void> }
interface PickerWindow extends Window { showSaveFilePicker?: (options: unknown) => Promise<{ createWritable (): Promise<Writer> }> }
const BUFFER_LIMIT = 128 * 1024 * 1024

function exportError (response: Response, body: unknown): Error {
  switch (response.status) {
    case 401: return new Error('Your session ended. Sign in and start the download again.')
    case 404: return new Error('No Library archive was found for this account.')
    case 409: return new Error('Your Library changed while the archive was prepared. Start the download again.')
    case 429: return new Error('Too many archive requests. Wait a moment and try again.')
    default: return libraryErrorFrom(response.status, body)
  }
}

/** Models read authority only. A failed stream never becomes a successful download. */
export async function exportLibrary (signal: AbortSignal, onProgress?: (received: number, total: number | null) => void): Promise<Blob | null> {
  const session = storedToken()
  const check = () => { signal.throwIfAborted(); if (!session || session !== storedToken()) throw new Error('The account changed. Start the download again.') }
  check()
  let writer: Writer | undefined
  const picker = (window as PickerWindow).showSaveFilePicker
  try {
    if (picker) { const handle = await picker.call(window, { suggestedName: 'muon3d-library.tar' }); check(); writer = await handle.createWritable() }
    const assertion = await modelsAssertion.get(); check()
    const response = await fetch(`${MODELS_URL}/v1/library/export`, { signal, headers: { authorization: `Bearer ${assertion}` }, credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer' })
    check()
    if (!response.ok) {
      if (response.status === 401) modelsAssertion.drop()
      let body: unknown; try { body = await response.json() } catch { body = null }
      throw exportError(response, body)
    }
    if (response.headers.get('content-type')?.split(';')[0] !== 'application/x-tar' || !response.body) throw new Error('The Library sent an unreadable archive.')
    const lengthHeader = response.headers.get('content-length')
    const total = lengthHeader && /^\d+$/.test(lengthHeader) ? Number(lengthHeader) : null
    if (!writer && total !== null && total > BUFFER_LIMIT) throw new Error('This browser can download archives up to 128 MiB. Use a browser with Save file support, or download individual files from Library.')
    const reader = response.body.getReader()
    const parts: Uint8Array[] = []; let size = 0; let prefix = new Uint8Array(); let tail = new Uint8Array()
    try {
      for (;;) {
        const { value, done } = await reader.read(); check(); if (done) break
        size += value.byteLength
        if (!writer && size > BUFFER_LIMIT) throw new Error('This browser can download archives up to 128 MiB. Download individual files from Library instead.')
        if (prefix.length < 512) prefix = new Uint8Array([...prefix, ...value.subarray(0, 512 - prefix.length)])
        const keep = value.length >= 1024 ? value.subarray(value.length - 1024) : new Uint8Array([...tail, ...value]).slice(-1024)
        tail = new Uint8Array(keep)
        if (writer) await writer.write(value)
        else parts.push(value)
        onProgress?.(size, total)
      }
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock() }
    check()
    if (size < 2048 || size % 512 || new TextDecoder().decode(prefix.subarray(257, 262)) !== 'ustar' || tail.length !== 1024 || tail.some(b => b !== 0)) throw new Error('The Library archive was incomplete. Start the download again.')
    if (writer) { await writer.close(); return null }
    return new Blob(parts, { type: 'application/x-tar' })
  } catch (error) { await writer?.abort().catch(() => {}); throw error }
}
