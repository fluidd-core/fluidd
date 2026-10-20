import type { Store } from 'vuex'
import { modelsAssertion } from './assertion'
import { MODELS_URL } from './api'
import { cloudState } from '@/services/muon-cloud/state'
import type { InstanceConfig } from '@/store/config/types'
import { printerNameParts } from '@/util/printer-name'

export interface RunStart {
  printer_id: string;
  printer_name: string;
  file_name: string;
  bytes?: Uint8Array;
  item_id?: string;
  version?: number;
}

export type RunOutcome = 'finished' | 'cancelled' | 'failed'
type AnyStore = Pick<Store<any>, 'state' | 'watch'>
const RETRIES = 2
let consentStopped = false
const libraryFiles = new Map<string, Omit<RunStart, 'printer_id' | 'printer_name' | 'file_name'>>()

export function resetRunReportingForTests () { consentStopped = false }

/** Attach Library metadata to the next observed start of this uploaded path. */
export function rememberLibraryFile (path: string, start: Pick<RunStart, 'bytes' | 'item_id' | 'version'>) {
  libraryFiles.set(path, start)
}

export async function sha256Hex (bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function request (path: string, method: string, body: object, key?: string, fetcher: typeof fetch = fetch): Promise<any | null> {
  if (consentStopped) return null
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const token = await modelsAssertion.get()
      const response = await fetcher(`${MODELS_URL}${path}`, {
        method,
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(key ? { 'Idempotency-Key': key } : {}) },
        body: JSON.stringify(body)
      })
      const data = await response.json().catch(() => null)
      if (response.ok) return data
      if (data?.error?.code === 'consent_required') { consentStopped = true; return null }
      if (response.status < 500) return null
    } catch { /* printing is never held up by reporting */ }
    if (attempt < RETRIES) await sleep(20 * (attempt + 1))
  }
  return null
}

export async function createRun (start: RunStart, fetcher: typeof fetch = fetch): Promise<{ id: string } | null> {
  const gcode_sha256 = start.bytes ? await sha256Hex(start.bytes) : undefined
  if (!gcode_sha256 && !start.file_name) return null
  const key = `control:${start.printer_id}:${gcode_sha256 ?? start.file_name}:${Date.now()}`
  return request('/v1/library/runs', 'POST', {
    printer_id: start.printer_id,
    printer_name: start.printer_name,
    ...(gcode_sha256 ? { gcode_sha256 } : {}),
    file_name: start.file_name,
    reporter: 'control',
    ...(start.item_id ? { item_id: start.item_id } : {}),
    ...(start.version !== undefined ? { version: start.version } : {})
  }, key, fetcher)
}

export function watchRunEnd (store: AnyStore, id: string, startedAt = Date.now(), fetcher: typeof fetch = fetch): () => void {
  const stop = store.watch(
    (state: any) => state.printer?.printer?.print_stats,
    (stats: any, before: any) => {
      if (!before || !['printing', 'paused'].includes(before.state) || ['printing', 'paused'].includes(stats?.state)) return
      const outcome: RunOutcome = stats?.state === 'complete' ? 'finished' : stats?.state === 'cancelled' || stats?.state === 'standby' ? 'cancelled' : 'failed'
      const progress = Number(store.state.printer?.printer?.virtual_sdcard?.progress)
      stop()
      request(`/v1/library/runs/${encodeURIComponent(id)}`, 'PATCH', {
        outcome,
        ...(outcome === 'failed' && Number.isFinite(progress) ? { progress_pct: Math.round(progress * 100) } : {}),
        duration_s: Math.max(0, Math.round((Date.now() - startedAt) / 1000))
      }, undefined, fetcher).catch(() => {})
    }
  )
  return stop
}

/** Fire-and-forget by design: model-service latency must never delay a print. */
export function reportStartedRun (store: AnyStore, start: RunStart): void {
  createRun(start).then(run => { if (run?.id) watchRunEnd(store, run.id) }).catch(() => {})
}

/** Observe every job Control sees start, including files started from Jobs or the panel. */
export function observePrintRuns (store: AnyStore): () => void {
  return store.watch(
    (state: any) => state.printer?.printer?.print_stats,
    (stats: any, before: any) => {
      if (stats?.state !== 'printing' || before?.state === 'printing' || !stats.filename) return
      const id = cloudState.activePrinterId ?? ((store.state.config?.instances ?? []) as InstanceConfig[])
        .find(instance => instance.apiUrl === store.state.config?.apiUrl)?.endpointId
      if (!id) return
      const account = cloudState.printers.find(printer => printer.id === id)
      const name = printerNameParts(account?.name ?? store.state.config?.displayName ?? 'Printer').name
      const library = libraryFiles.get(stats.filename)
      libraryFiles.delete(stats.filename)
      reportStartedRun(store, { printer_id: id, printer_name: name, file_name: stats.filename, ...library })
    }
  )
}
