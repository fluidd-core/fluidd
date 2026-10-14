import Vue from 'vue'
import { ACTIVE_PHASES, DEFAULT_BUDGET_MS, lost, outcome, remember, type AuxUpdateStatus, type Remembered } from './model'

/**
 * Fluidd's eye on the printer's own update: its Aux /update/status, read
 * every minute (every 5 s while an install is under way), and the install
 * it last saw under way, kept per printer in this browser so it outlives a
 * reload. When the printer goes quiet mid-install, `lostAt` is set and the
 * Updating screen takes the place of "can't reach" (model.ts offlineScreen).
 *
 * In this bundle's main chunk, not a lazy one: during the restart the
 * printer can't serve a chunk, and on plain HTTP there is no service worker
 * to serve it either.
 */
export const updateWatch = Vue.observable({
  status: null as AuxUpdateStatus | null,
  remembered: null as Remembered | null,
  /** The printer these are for (its address name). */
  printer: '',
  /** Ticks while an install is under way, so the screens can say when the restart is taking long. */
  now: Date.now()
})

type Get = (url: string) => Promise<{ status?: number, data?: unknown }>

const storageKey = (printer: string) => `muon3d.update.${printer}`

function save () {
  try {
    const key = storageKey(updateWatch.printer)
    if (updateWatch.remembered) localStorage.setItem(key, JSON.stringify(updateWatch.remembered))
    else localStorage.removeItem(key)
  } catch { /* private window: it lasts until the tab closes */ }
}

function load (printer: string): Remembered | null {
  try {
    const raw = localStorage.getItem(storageKey(printer))
    return raw ? JSON.parse(raw) as Remembered : null
  } catch {
    return null
  }
}

let timer: ReturnType<typeof setTimeout> | null = null
let ticker: ReturnType<typeof setInterval> | null = null
let get: Get | null = null

const active = () => !!updateWatch.remembered && ACTIVE_PHASES.includes(updateWatch.remembered.phase)

function schedule () {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => { poll() }, active() ? 5000 : 60000)
  if (active() && !ticker) ticker = setInterval(() => { updateWatch.now = Date.now() }, 5000)
  if (!active() && ticker) {
    clearInterval(ticker)
    ticker = null
  }
}

/** Reads the printer's update status now. A refusal (network protection, over Iroh) shows nothing. */
export async function poll (): Promise<void> {
  if (!get) return
  try {
    const answer = await get('/server/aux/update/status')
    const data = answer.data as Record<string, unknown> | undefined
    const status = (data && typeof data === 'object' && 'result' in data ? data.result : data) as AuxUpdateStatus | undefined
    if (answer.status === 200 && status && typeof status === 'object') {
      updateWatch.status = status
      updateWatch.remembered = remember(updateWatch.remembered, status, Date.now())
      save()
    }
  } catch { /* the next poll tries again */ }
  updateWatch.now = Date.now()
  schedule()
}

/** Starts watching `printer`, with Fluidd's own HTTP client. */
export function watchUpdates (printer: string, http: Get) {
  get = http
  if (printer !== updateWatch.printer) {
    updateWatch.printer = printer
    updateWatch.status = null
    updateWatch.remembered = load(printer)
  }
  poll()
}

/** The printer stopped answering: remember when, if an install was under way. */
export function printerLost () {
  updateWatch.remembered = lost(updateWatch.remembered, Date.now())
  updateWatch.now = Date.now()
  save()
  schedule()
}

/** An install was just asked for: follow it closely from now. */
export function installStarted (from: string | null, to: string | null) {
  updateWatch.remembered = {
    jobId: null,
    phase: 'preparing',
    from,
    to,
    progress: null,
    seenAt: Date.now(),
    lostAt: null,
    budgetMs: updateWatch.remembered?.budgetMs ?? DEFAULT_BUDGET_MS
  }
  save()
  poll()
}

/** How the followed install ended, once the printer is back. */
export function currentOutcome () {
  return outcome(updateWatch.remembered, updateWatch.status)
}

/** The outcome has been shown: forget the install. */
export function forgetInstall () {
  updateWatch.remembered = null
  save()
  schedule()
}

export function stopWatching () {
  if (timer) clearTimeout(timer)
  if (ticker) clearInterval(ticker)
  timer = null
  ticker = null
}
