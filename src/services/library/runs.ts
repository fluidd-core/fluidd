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
  /** SHA-256 of the G-code as the Library stores it (the gzip bytes when it is gzip), never of unzipped bytes. */
  gcode_sha256?: string;
  /** Your own item and version; sent together or not at all. */
  item_id?: string;
  version?: number;
  /** A public print: the share id. */
  publication_id?: string;
}

export type RunOutcome = 'finished' | 'cancelled' | 'failed'
type AnyStore = Pick<Store<any>, 'state' | 'watch'>
type PrintSnapshot = [state: string, filename: string, printDuration: number, totalDuration: number]
const RETRIES = 2
let consentStopped = false
const libraryFiles = new Map<string, Omit<RunStart, 'printer_id' | 'printer_name' | 'file_name'>>()

export function resetRunReportingForTests () { consentStopped = false; libraryFiles.clear() }

const printSnapshot = (state: any): PrintSnapshot => {
  const stats = state.printer?.printer?.print_stats
  return [stats?.state ?? '', stats?.filename ?? '', stats?.print_duration ?? 0, stats?.total_duration ?? 0]
}

const printerId = (store: AnyStore): string | undefined => cloudState.activePrinterId ?? ((store.state.config?.instances ?? []) as InstanceConfig[])
  .find(instance => instance.apiUrl === store.state.config?.apiUrl)?.endpointId

/** Attach Library metadata to the next observed start of this uploaded path. */
export function rememberLibraryFile (path: string, start: Pick<RunStart, 'gcode_sha256' | 'item_id' | 'version' | 'publication_id'>) {
  libraryFiles.set(path, start)
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
  const { gcode_sha256 } = start
  if (!gcode_sha256 && !start.file_name) return null
  // Not de-duplicated across browsers: every Control tab watching this printer reports its own run.
  const key = `control:${start.printer_id}:${gcode_sha256 ?? start.file_name}:${Date.now()}`
  return request('/v1/library/runs', 'POST', {
    printer_id: start.printer_id,
    printer_name: start.printer_name,
    ...(gcode_sha256 ? { gcode_sha256 } : {}),
    file_name: start.file_name,
    reporter: 'control',
    ...(start.item_id && start.version !== undefined ? { item_id: start.item_id, version: start.version } : {}),
    ...(start.publication_id ? { publication_id: start.publication_id } : {})
  }, key, fetcher)
}

/**
 * Closes the run when the print ends. It stops for good if the page moves to
 * another printer first: a run left running by switching away mid-print is
 * never closed (a known limitation).
 */
export function watchRunEnd (store: AnyStore, id: string, startedAt = Date.now(), fetcher: typeof fetch = fetch, expectedPrinterId = printerId(store)): () => void {
  const stop = store.watch(
    printSnapshot,
    ([state], [beforeState]) => {
      // A delayed create response must not attach this run to whichever printer
      // the user has opened in the meantime.
      if (printerId(store) !== expectedPrinterId) return stop()
      if (!['printing', 'paused'].includes(beforeState) || !['complete', 'cancelled', 'error'].includes(state)) return
      const outcome: RunOutcome = state === 'complete' ? 'finished' : state === 'cancelled' ? 'cancelled' : 'failed'
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
  createRun(start).then(run => { if (run?.id && printerId(store) === start.printer_id) watchRunEnd(store, run.id, Date.now(), fetch, start.printer_id) }).catch(() => {})
}

/**
 * Observe every job Control sees start. A file Control did not upload itself
 * (started from Jobs or the panel) is reported by name only, with no hash:
 * its file is never downloaded just to hash it.
 */
export function observePrintRuns (store: AnyStore): () => void {
  return store.watch(
    printSnapshot,
    ([state, filename], [beforeState]) => {
      if (state !== 'printing' || !['standby', 'complete', 'cancelled', 'error'].includes(beforeState) || !filename) return
      const id = printerId(store)
      if (!id) return
      const account = cloudState.printers.find(printer => printer.id === id)
      const name = printerNameParts(account?.name ?? store.state.config?.displayName ?? 'Printer').name
      const library = libraryFiles.get(filename)
      libraryFiles.delete(filename)
      reportStartedRun(store, { printer_id: id, printer_name: name, file_name: filename, ...library })
    }
  )
}
