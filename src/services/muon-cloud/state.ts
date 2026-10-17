/**
 * The Muon3D account, its linked printers, and their live status.
 *
 * Kept outside Vuex on purpose: Fluidd resets its whole store every time it
 * switches printer, and the account must survive the switch.
 */
import Vue from 'vue'
import {
  cloudApi,
  CloudError,
  storedToken,
  storeRefreshToken,
  storeToken,
  TOKEN_KEY,
  type CloudAccount,
  type CloudConfig,
  type CloudPrinter,
  type AccessHandoff
} from './api'
import { centralLoginEnabled, clearSilentAttempt, redirectUri, signOutCentral, takeCallback } from './centralLogin'
import { browserEndpoint, forgetBrowserKey, managedEndpointFactory } from './iroh'
import { createPrinterTransportForSelection, type AuthorizedManagedRelaySession, type PrinterTransport, type PrinterSocket } from '@/services/managed-transport'
import { consolePresence } from './presence'
import { STATUS_QUERY, statusFrom, type PrinterStatus } from './status'
import { deletionState } from './deletion'

const ACTIVE_KEY = 'muon.cloud.active'

/** A printer's live state, read over its own Iroh connection (the reading is shared with the network's: status.ts). */
export type { PrinterStatus } from './status'

export interface FleetLayout {
  groups: Array<{ id: string, name: string, printers: string[] }>;
  widgets: Record<string, boolean>;
  density: 'comfortable' | 'compact';
}

export const DEFAULT_FLEET_LAYOUT: FleetLayout = {
  groups: [],
  widgets: {
    model: true,
    progress: true,
    temps: true,
    eta: true,
    file: true,
    position: true,
    layer: true,
    factors: false
  },
  density: 'comfortable'
}

interface CloudState {
  ready: boolean;
  account: CloudAccount | null;
  config: CloudConfig | null;
  printers: CloudPrinter[];
  status: Record<string, PrinterStatus>;
  activePrinterId: string | null;
  layout: FleetLayout;
  error: string | null;
  endpointId: string | null;
}

export const cloudState = Vue.observable<CloudState>({
  ready: false,
  account: null,
  config: null,
  printers: [],
  status: {},
  activePrinterId: readActive(),
  layout: { ...DEFAULT_FLEET_LAYOUT },
  error: null,
  endpointId: null
})

function readActive (): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY)
  } catch {
    return null
  }
}

export function setActiveCloudPrinter (id: string | null) {
  cloudState.activePrinterId = id
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id)
    else localStorage.removeItem(ACTIVE_KEY)
  } catch { /* no storage */ }
}

/** The fleet owns one transport per printer; the dashboard borrows it. */
const statusConnections = new Map<string, Promise<PrinterTransport>>()
const grants = new Map<string, Promise<AccessHandoff>>()
const polling = new Set<string>()
let sessionAbort = new AbortController()
let endpointRegistration: Promise<void> | null = null
let pollTimer: number | null = null
let printersTimer: number | null = null

async function ensureEndpoint (): Promise<void> {
  if (!endpointRegistration) {
    const signal = sessionAbort.signal
    const pending = (async () => {
      if (!cloudState.config) cloudState.config = await cloudApi.config()
      signal.throwIfAborted()
      const endpoint = await browserEndpoint(cloudState.config.relay_url)
      signal.throwIfAborted()
      const id = endpoint.endpointId()
      if (cloudState.endpointId !== id) {
        await cloudApi.registerEndpoint(id)
        signal.throwIfAborted()
        cloudState.endpointId = id
      }
    })()
    endpointRegistration = pending
    pending.finally(() => { if (endpointRegistration === pending) endpointRegistration = null }).catch(() => {})
  }
  return endpointRegistration
}

function waitForRetry (ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted()
    const abort = () => { clearTimeout(timer); reject(signal.reason) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, ms)
    signal.addEventListener('abort', abort, { once: true })
  })
}

/** One pending grant per printer, retrying only temporary console failures. */
export function requestAccess (printerId: string): Promise<AccessHandoff> {
  if (deletionState.deleteAfter !== null) {
    return Promise.reject(new CloudError('Your account is waiting to be deleted.', 403, undefined, {
      deletion_pending: true, delete_after: deletionState.deleteAfter
    }))
  }
  const existing = grants.get(printerId)
  if (existing) return existing
  const signal = sessionAbort.signal
  const pending = (async () => {
    await ensureEndpoint()
    let delay = 1000
    for (;;) {
      signal.throwIfAborted()
      const printer = cloudState.printers.find(p => p.id === printerId)
      if (printer && consolePresence(printer) === 'offline') throw new CloudError('Printer is offline', 503)
      try {
        const grant = await cloudApi.access(printerId)
        signal.throwIfAborted()
        return grant
      } catch (error) {
        signal.throwIfAborted()
        if (!(error instanceof CloudError) || error.status !== 503) throw error
        await waitForRetry(delay, signal)
        delay = Math.min(15_000, delay * 2)
      }
    }
  })()
  grants.set(printerId, pending)
  pending.finally(() => { if (grants.get(printerId) === pending) grants.delete(printerId) }).catch(() => {})
  return pending
}

async function handoff (printerId: string, signal: AbortSignal): Promise<AuthorizedManagedRelaySession> {
  signal.throwIfAborted()
  const grant = await requestAccess(printerId)
  signal.throwIfAborted()
  return {
    contractVersion: 'managed-iroh/v1',
    sessionId: grant.grant_id,
    tenantId: cloudState.account?.id ?? '',
    printerId: grant.printer_id,
    relayUrl: grant.relay_url,
    expiresAt: new Date(grant.expires_at * 1000).toISOString()
  }
}

async function statusConnection (printerId: string): Promise<PrinterTransport> {
  let existing = statusConnections.get(printerId)
  if (!existing) {
    const signal = sessionAbort.signal
    existing = createPrinterTransportForSelection(
      { kind: 'managed-iroh', printerId },
      { handoffSelectedPrinter: id => handoff(id, signal), createManagedEndpoint: managedEndpointFactory }
    )
    statusConnections.set(printerId, existing)
    const pending = existing
    pending.catch(() => { if (statusConnections.get(printerId) === pending) statusConnections.delete(printerId) })
  }
  return existing
}

async function pollOne (printer: CloudPrinter) {
  const signal = sessionAbort.signal
  const unavailable = (error: string) => {
    if (signal.aborted) return
    Vue.set(cloudState.status, printer.id, { ...cloudState.status[printer.id], reachable: false, error, updatedAt: Date.now() })
  }
  const presence = consolePresence(printer)
  if (presence !== 'online') unavailable(presence)
  if (presence === 'offline' || polling.has(printer.id)) return
  polling.add(printer.id)
  try {
    const connection = await statusConnection(printer.id)
    const response = await connection.fetch(STATUS_QUERY)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const s = (await response.json()).result.status
    if (signal.aborted) return
    const latest = cloudState.printers.find(p => p.id === printer.id)
    if (!latest) return
    const presence = consolePresence(latest)
    Vue.set(cloudState.status, printer.id, {
      reachable: presence === 'online',
      error: presence === 'online' ? undefined : presence,
      ...statusFrom(s),
      updatedAt: Date.now()
    } as PrinterStatus)
  } catch (error) {
    const latest = cloudState.printers.find(p => p.id === printer.id)
    if (latest) unavailable(consolePresence(latest) === 'offline' ? 'offline' : 'reconnecting')
  } finally {
    if (!signal.aborted) polling.delete(printer.id)
  }
}

/** A connection to a cloud printer for anything besides status, such as file reads. */
export function cloudPrinterConnection (printerId: string): Promise<PrinterTransport> {
  return statusConnection(printerId)
}

/** The selected page owns its sockets, but cannot close the shared transport. */
export async function borrowCloudPrinter (printerId: string): Promise<PrinterTransport> {
  const shared = await statusConnection(printerId)
  const sockets = new Set<PrinterSocket>()
  let closed = false
  return {
    async fetch (path, init) {
      if (closed) throw new Error('Printer page closed')
      const response = await shared.fetch(path, init)
      if (closed) throw new Error('Printer page closed')
      return response
    },
    async openWebSocket (path) {
      if (closed) throw new Error('Printer page closed')
      const socket = await shared.openWebSocket(path)
      if (closed) { socket.close(); throw new Error('Printer page closed') }
      sockets.add(socket)
      socket.addEventListener('close', () => sockets.delete(socket))
      return socket
    },
    close () {
      closed = true
      for (const socket of sockets) socket.close()
      sockets.clear()
    }
  }
}

async function pollAll () {
  if (deletionState.deleteAfter !== null) {
    for (const connection of statusConnections.values()) connection.then(c => c.close()).catch(() => {})
    statusConnections.clear()
    if (Object.keys(cloudState.status).length) cloudState.status = {}
    return
  }
  await Promise.all(cloudState.printers.map(p => pollOne(p)))
}

export async function refreshPrinters () {
  if (!cloudState.account || deletionState.deleteAfter !== null) return
  try {
    cloudState.printers = (await cloudApi.printers()).printers
  } catch (error) {
    if (error instanceof CloudError && error.status === 401) await dropSession()
  }
}

function startPolling () {
  stopPolling()
  pollTimer = window.setInterval(() => { pollAll() }, 3000)
  printersTimer = window.setInterval(() => { refreshPrinters() }, 10000)
  pollAll()
}

function stopPolling () {
  if (pollTimer !== null) window.clearInterval(pollTimer)
  if (printersTimer !== null) window.clearInterval(printersTimer)
  pollTimer = printersTimer = null
}

async function dropSession () {
  stopPolling()
  sessionAbort.abort()
  sessionAbort = new AbortController()
  endpointRegistration = null
  grants.clear()
  polling.clear()
  storeToken(null)
  storeRefreshToken(null)
  for (const c of statusConnections.values()) c.then(p => p.close()).catch(() => {})
  statusConnections.clear()
  cloudState.account = null
  cloudState.printers = []
  cloudState.status = {}
  cloudState.endpointId = null
}

async function adoptSession (token: string, account: CloudAccount) {
  storeToken(token)
  cloudState.account = account
  cloudState.error = null
  await refreshPrinters()
  try {
    const { layout } = await cloudApi.getLayout()
    cloudState.layout = { ...DEFAULT_FLEET_LAYOUT, ...layout, widgets: { ...DEFAULT_FLEET_LAYOUT.widgets, ...(layout?.widgets ?? {}) } }
  } catch { /* keep the default */ }
  startPolling()
}

// Another tab signed out, or the console's front-channel logout page
// (public/auth/logout.html) cleared the token: this tab is signed out too.
try {
  window.addEventListener('storage', (event) => {
    if ((event.key === TOKEN_KEY || event.key === null) && !storedToken() && cloudState.account) dropSession()
  })
} catch { /* no window */ }

/**
 * Finishes a return from the console's `/authorize` (`WEB-12`): exchanges the
 * code at `/token`, or notes that the console has no session. Answers the
 * hash route the sign-in started from, for the caller to go back to.
 */
async function completeCentralSignIn (): Promise<string | null> {
  if (!centralLoginEnabled()) return null
  const result = takeCallback()
  switch (result.outcome) {
    case 'none':
      return null
    case 'code':
      try {
        const session = await cloudApi.exchangeCode(result.code, redirectUri(), result.verifier)
        storeToken(session.access_token)
        storeRefreshToken(session.refresh_token)
        clearSilentAttempt()
      } catch (error) {
        cloudState.error = (error as Error).message
      }
      return result.returnTo
    case 'signed_out':
      return result.returnTo
    case 'error':
      cloudState.error = result.message
      return result.returnTo
  }
}

/**
 * Restores a saved session at start-up, after completing a central sign-in
 * if this load is the return from one. Answers the hash route to go back to,
 * or null.
 */
export async function initCloud (): Promise<string | null> {
  const returnTo = await completeCentralSignIn()
  const token = storedToken()
  if (token) {
    try {
      const me = await cloudApi.me()
      const currentToken = storedToken()
      if (currentToken) await adoptSession(currentToken, me.account)
    } catch (error) {
      if (error instanceof CloudError && error.status === 401) await dropSession()
    }
  }
  cloudState.ready = true
  return returnTo
}

export async function signIn (email: string, password: string) {
  const { token, account } = await cloudApi.signIn(email, password)
  await adoptSession(token, account)
}

export async function signUp (email: string, password: string, name: string, declaredAge?: number) {
  const { token, account } = await cloudApi.signUp(email, password, name, declaredAge)
  await adoptSession(token, account)
}

/** True when the console's logout form is navigating away. */
export async function signOut (): Promise<boolean> {
  if (centralLoginEnabled()) {
    // The console ends the browser session and every session issued from
    // it, this one included, and tells the other surfaces.
    await dropSession()
    forgetBrowserKey()
    setActiveCloudPrinter(null)
    signOutCentral()
    return true
  }
  try {
    await cloudApi.signOut()
  } catch { /* the session ends here either way */ }
  await dropSession()
  forgetBrowserKey()
  setActiveCloudPrinter(null)
  return false
}

export async function saveLayout (layout: FleetLayout) {
  cloudState.layout = layout
  try {
    await cloudApi.putLayout(layout)
  } catch (error) {
    cloudState.error = (error as Error).message
  }
}

export function printerName (id: string): string {
  return cloudState.printers.find(p => p.id === id)?.name ?? id.slice(0, 8)
}
