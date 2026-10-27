/**
 * Print on…: a saved print sent to one of the account's printers. The
 * Library never contacts a printer (MSV-2): this browser downloads the
 * G-code and uploads it the way Fluidd uploads any file, to the printer
 * Fluidd is on. So a print for another printer first switches Fluidd to it,
 * as the rail and the switcher do, by going to its Jobs page.
 *
 * The dialog (PrintOnDialog) asks the plate check before Print now, as
 * Fluidd's own print check does: nothing starts without that tick. Once on
 * the printer, what it has loaded is read again, and a print that no longer
 * fits, or a printer that started something meanwhile, stops it before the
 * upload. Then it starts (the Spoolman dialog first, when that is on), or
 * goes in the queue, or only onto the printer. A print counts as printed on
 * that printer (`printed`) once it starts: when the printer answers the
 * start, or, for a queued print or one the Spoolman dialog starts, when the
 * printer reports it printing that file.
 */
import type VueRouter from 'vue-router'
import type { Store } from 'vuex'
import { EventBus } from '@/eventBus'
import { httpClientActions } from '@/api/httpClientActions'
import { SocketActions } from '@/api/socketActions'
import { isActiveSlug, printerPath } from '@/services/printer-pages'
import { cloudPrinterConnection } from '@/services/muon-cloud/state'
import { savedMaterialName } from '@/services/control/model'
import type { ItemSetup, LibraryItem } from './api'
import { gunzip, isGzip, sha256Hex } from './bytes'
import { fitText, setupFit, type PrinterFacts } from './fit'
import { cleanName } from './save'
import { libraryClient, recordPrinted } from './store'
import { rememberLibraryFile } from './runs'

/** One of the account's printers, as Print on… lists it. */
export interface PrintTarget {
  /** Its id in the account (its EndpointId). */
  id: string;
  name: string;
  /** Its page's address: /boxwood-367a. */
  slug: string;
  /** Fluidd is on it now. */
  active: boolean;
}

/** How long a switch of printer may take before Print on… gives up. */
export const OPEN_PRINTER_MS = 60_000

/** How long after the upload a start still counts as this print's. */
export const START_WATCH_MS = 30 * 60_000

/** How long a printer may take to answer a start: up to 150 s, as the slicer's host allows. */
export const START_ANSWER_MS = 150_000

/** A queued print may wait for the plate to be cleared. */
export const QUEUE_WATCH_MS = 12 * 60 * 60_000

/** What the Library lists for a stored G-code file: the bytes as stored and served, which may be gzip. */
export interface StoredFileFacts {
  sha256: string;
  size_bytes: number;
  encoding: 'identity' | 'gzip';
}

/** A downloaded G-code: the bytes ready for a printer, and the SHA-256 of the bytes as stored (what run reporting sends). */
export interface GcodeDownload {
  bytes: Uint8Array;
  stored_sha256: string;
}

/**
 * Checks the stored bytes against what the Library lists (size, then SHA-256)
 * BEFORE anything unzips them, then unzips when they are gzip. Without a
 * listing nothing can be checked: gzip is then recognised by its header.
 */
async function unpackStored (stored: Uint8Array, expected?: StoredFileFacts): Promise<GcodeDownload> {
  const stored_sha256 = await sha256Hex(stored)
  if (expected && (stored.byteLength !== expected.size_bytes || stored_sha256 !== expected.sha256.toLowerCase())) {
    throw new Error('The G-code did not match its listing. Nothing was sent to the printer.')
  }
  const zipped = expected ? expected.encoding === 'gzip' : isGzip(stored)
  return { bytes: zipped ? await gunzip(stored) : stored, stored_sha256 }
}

/** The listing of one of your own items' G-code files, from its version's metadata. */
export async function ownFileFacts (item: Pick<LibraryItem, 'id' | 'version'>, setup: Pick<ItemSetup, 'file_id'>): Promise<StoredFileFacts | undefined> {
  if (typeof item.version !== 'number') return undefined
  const { versions } = await libraryClient().versions(item.id)
  const file = versions.find(v => v.number === item.version)?.files.find(f => f.id === setup.file_id)
  if (!file) throw new Error('That G-code is no longer in this version of the print.')
  return { sha256: file.sha256, size_bytes: file.size_bytes, encoding: file.encoding }
}

/** One of your own G-codes, downloaded, checked against `expected` when it is known, and unzipped. */
export async function fetchGcode (item: Pick<LibraryItem, 'id'>, setup: ItemSetup, expected?: StoredFileFacts): Promise<GcodeDownload> {
  const client = libraryClient()
  return unpackStored(await client.get(await client.fileUrl(item.id, setup.file_id)), expected)
}

/** The G-code's bytes, uncompressed: the Library keeps it gzip-compressed. */
export async function downloadGcode (item: Pick<LibraryItem, 'id'>, setup: ItemSetup, expected?: StoredFileFacts): Promise<Uint8Array> {
  return (await fetchGcode(item, setup, expected)).bytes
}

/**
 * A live Community publication's G-code, read through its viewer-authorised
 * share route: the service answers the stored bytes, which are checked
 * against the size and SHA-256 the publication lists before they are
 * unzipped or used.
 */
export async function downloadSharedGcode (shareId: string, fileId: string, expected: StoredFileFacts): Promise<GcodeDownload> {
  return unpackStored(await libraryClient().shareFile(shareId, fileId), expected)
}

/** The project (.3mf), as the Library keeps it. */
export async function downloadProject (item: LibraryItem): Promise<Uint8Array> {
  if (!item.project_file_id) throw new Error('This print has no project saved.')
  const client = libraryClient()
  return client.get(await client.fileUrl(item.id, item.project_file_id))
}

/** A file name the printer takes: the print's name, without what a path or a shell would read. */
export function gcodeFileName (item: Pick<LibraryItem, 'name'>): string {
  const stem = cleanName(item.name, 'print').replace(/[\\/:*?"<>|]+/g, '-').replace(/^[.\s-]+/, '').slice(0, 120).trim()
  return `${stem || 'print'}.gcode`
}

/** Hands `bytes` to the browser to keep as `name`. */
export function saveToComputer (bytes: Uint8Array, name: string, type = 'application/octet-stream') {
  const url = URL.createObjectURL(new Blob([bytes], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

type AnyStore = Pick<Store<any>, 'state' | 'getters' | 'dispatch' | 'commit' | 'watch'>

/** Whether Fluidd is on `slug` and can take a file: connected, signed in, Klipper ready. */
export function printerReady (store: AnyStore, slug: string): boolean {
  return isActiveSlug(slug) &&
    store.getters['socket/getConnectionState'] === true &&
    store.getters['auth/getAuthenticated'] === true &&
    store.getters['printer/getKlippyReady'] === true
}

async function until (ready: () => boolean, ms: number): Promise<boolean> {
  const end = Date.now() + ms
  while (!ready()) {
    if (Date.now() > end) return false
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  return true
}

/** Switches Fluidd to the printer (its Jobs page) and waits until it can take a file. */
export async function openPrinter (router: VueRouter, store: AnyStore, target: PrintTarget): Promise<void> {
  await router.push(printerPath(target.slug, 'jobs')).catch(() => {})
  if (!await until(() => printerReady(store, target.slug), OPEN_PRINTER_MS)) {
    throw new Error(`${target.name} didn't answer. Try again once it's on.`)
  }
}

/** Uploads to the printer Fluidd is on, through its own upload, shown in its uploads. Answers the stored path. */
export async function uploadGcode (store: AnyStore, name: string, bytes: Uint8Array): Promise<string> {
  const file = new File([bytes], name, { type: 'text/plain' })
  const abortController = new AbortController()
  await store.dispatch('files/updateFileUpload', { filepath: name, size: file.size, loaded: 0, percent: 0, speed: 0, cancelled: false, abortController })
  try {
    const response = await httpClientActions.serverFilesUploadPost(file, '', 'gcodes', false, {
      signal: abortController.signal,
      onUploadProgress: (event) => {
        store.dispatch('files/updateFileUpload', {
          filepath: name,
          loaded: event.loaded,
          percent: event.progress ? Math.round(event.progress * 100) : 0,
          speed: event.rate ?? 0
        })
      }
    })
    // Moonraker answers an upload without the `result` wrapper; read either.
    const answer = response.data as { result?: { item?: { path?: string } }, item?: { path?: string } } | undefined
    return answer?.result?.item?.path || answer?.item?.path || name
  } finally {
    store.dispatch('files/removeFileUpload', name)
  }
}

let stopWatching: (() => void) | null = null

/**
 * Calls `started` once the printer Fluidd is on prints `path`, within
 * START_WATCH_MS and before Fluidd switches printer. One print is watched at
 * a time: a newer Print on… replaces it.
 */
export function watchForStart (store: AnyStore, path: string, started: () => void, ms = START_WATCH_MS): () => void {
  stopWatching?.()
  const apiUrl = store.state.config.apiUrl
  let timer: ReturnType<typeof setTimeout> | null = null
  const stop = () => {
    unwatch()
    if (timer) clearTimeout(timer)
    if (stopWatching === stop) stopWatching = null
  }
  const unwatch = store.watch(
    (state: any) => [state.config.apiUrl, state.printer.printer.print_stats?.state, state.printer.printer.print_stats?.filename] as const,
    ([url, state, filename]) => {
      if (url !== apiUrl) return stop()
      if (state === 'printing' && filename === path) {
        stop()
        started()
      }
    }
  )
  timer = setTimeout(stop, ms)
  stopWatching = stop
  return stop
}

/** What the printer Fluidd is on is printing (or has paused), or null when it is free. */
export function printingNow (store: AnyStore): string | null {
  const stats = store.state.printer?.printer?.print_stats ?? {}
  return stats.state === 'printing' || stats.state === 'paused' ? (stats.filename || 'a print') : null
}

/** Print now (after the plate check), into the queue behind what prints now, or only onto the printer. */
export type SendMode = 'print' | 'queue' | 'save'

/**
 * Print on…, for a print that fits: download, switch, check again, upload,
 * then start it, queue it or leave it there. `step` says what is happening,
 * for the dialog.
 */
export async function sendToPrinter (options: {
  router: VueRouter;
  store: AnyStore;
  item: Pick<LibraryItem, 'id' | 'name' | 'version'>;
  setup: ItemSetup;
  target: PrintTarget;
  mode: SendMode;
  model?: string | null;
  step?: (text: string) => void;
}): Promise<void> {
  const { router, store, item, setup, target, mode } = options
  const step = options.step ?? (() => {})
  step('Downloading the G-code…')
  const { bytes, stored_sha256 } = await fetchGcode(item, setup, await ownFileFacts(item, setup))
  step(`Opening ${target.name}…`)
  await openPrinter(router, store, target)

  // Now that Fluidd is on it, what it has loaded is known for sure.
  const fit = setupFit(setup, activePrinterFacts(store, options.model ?? null))
  if (fit.kind !== 'ready') throw new Error(fitText(fit).label)
  const busy = printingNow(store)
  if (mode === 'print' && busy) throw new Error(`${target.name} started printing ${busy}. Add this to its queue instead.`)

  const name = gcodeFileName(item)
  EventBus.$emit(`Sending ${item.name} to ${target.name}…`, { timeout: 0 })
  let path: string
  try {
    path = await uploadGcode(store, name, bytes)
  } catch (error) {
    EventBus.$emit(`${item.name} couldn't be sent to ${target.name}.`, { type: 'error', timeout: 0 })
    throw error
  }
  if (mode === 'save') {
    EventBus.$emit(`${item.name} is on ${target.name}, in its Jobs.`, { type: 'success', timeout: 4000 })
    return
  }

  const printed = () => {
    recordPrinted(item.id, {
      printer_name: target.name,
      setup: { printer_model: setup.printer_model, nozzle_mm: setup.nozzle_mm, material: setup.material },
      ...(typeof item.version === 'number' ? { version: item.version } : {})
    }).catch(() => {})
    rememberLibraryFile(path, {
      gcode_sha256: stored_sha256,
      ...(typeof item.version === 'number' ? { item_id: item.id, version: item.version } : {})
    })
  }
  if (mode === 'queue') {
    watchForStart(store, path, printed, QUEUE_WATCH_MS)
    await SocketActions.serverJobQueuePostJob([path])
    EventBus.$emit(`${item.name} is in ${target.name}'s queue.`, { type: 'success', timeout: 4000 })
    return
  }
  // As Fluidd starts any file: the Spoolman dialog first, when that is on, and it starts the print.
  const spoolman = store.getters['spoolman/getAvailable'] && store.state.config?.uiSettings?.spoolman?.autoSpoolSelectionDialog
  if (spoolman) {
    watchForStart(store, path, printed)
    store.commit('spoolman/setDialogState', { show: true, filename: path })
    return
  }
  try {
    rememberLibraryFile(path, { gcode_sha256: stored_sha256, ...(typeof item.version === 'number' ? { item_id: item.id, version: item.version } : {}) })
    await httpClientActions.post('/printer/print/start', { filename: path }, { timeout: START_ANSWER_MS })
  } catch (error) {
    EventBus.$emit(`${target.name} didn't start ${item.name}. It's in its Jobs.`, { type: 'error', timeout: 0 })
    throw error
  }
  printed()
  EventBus.$emit(`${item.name} is printing on ${target.name}.`, { type: 'success', timeout: 4000 })
}

/** What the printer Fluidd is on has: its nozzle (Klipper's config) and what's loaded (its save_variables). */
export function activePrinterFacts (store: AnyStore, model: string | null): PrinterFacts {
  const printer = store.state.printer?.printer ?? {}
  const nozzle = Number(printer.configfile?.settings?.extruder?.nozzle_diameter)
  const material = 'save_variables' in printer
    ? savedMaterialName(printer.save_variables?.variables)
    : (store.state.config?.uiSettings?.general?.loadedMaterial as string | null | undefined) ?? null
  return {
    online: store.getters['socket/getConnectionState'] === true && store.getters['printer/getKlippyReady'] === true,
    model,
    nozzleMm: Number.isFinite(nozzle) && nozzle > 0 ? nozzle : null,
    material: material || null
  }
}

/** What a printer has, from its objects query (save_variables, configfile=settings): null for what it didn't say. */
export function loadedFromStatus (status: any): { nozzleMm: number | null, material: string | null } {
  const nozzle = Number(status?.configfile?.settings?.extruder?.nozzle_diameter)
  return {
    nozzleMm: Number.isFinite(nozzle) && nozzle > 0 ? nozzle : null,
    material: savedMaterialName(status?.save_variables?.variables)
  }
}

const LOADED_QUERY = '/printer/objects/query?save_variables&configfile=settings'

/**
 * Another account printer's nozzle and what's loaded, asked over its own
 * Muon3D connection (the one its status comes over).
 */
export async function remotePrinterFacts (printerId: string): Promise<{ nozzleMm: number | null, material: string | null }> {
  const connection = await cloudPrinterConnection(printerId)
  const response = await connection.fetch(LOADED_QUERY)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return loadedFromStatus((await response.json())?.result?.status)
}

/** The same, from a printer saved in this browser, asked on this network at its own address. */
export async function localPrinterFacts (apiUrl: string): Promise<{ nozzleMm: number | null, material: string | null }> {
  const response = await fetch(`${apiUrl.replace(/\/+$/, '')}${LOADED_QUERY}`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return loadedFromStatus((await response.json())?.result?.status)
}
