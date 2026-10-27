/**
 * The Muon3D account console's HTTP API.
 *
 * Fluidd is served either by the printer (LAN) or by the console itself. In
 * both cases the console is reached at `cloudBaseUrl()`: the page's own origin
 * when the console serves Fluidd, or the URL saved in `muon.cloud.url`.
 */

import { clearDeletion, deletionRevision, observeDeletion } from './deletion'
export { deletionState } from './deletion'

export const TOKEN_KEY = 'muon.cloud.token'
/** Only a central-login session (`WEB-12`) has one; it refreshes at `/token`. */
export const REFRESH_KEY = 'muon.cloud.refresh'
const URL_KEY = 'muon.cloud.url'

/** This surface's id in the console's client registry (`clients.json`). */
export const CLIENT_ID = 'fluidd'

export interface CloudAccount {
  id: string;
  email: string;
  name: string;
  created_at: number;
  deletion?: { requested_at: number, delete_after: number } | null;
}

export interface CloudPrinter {
  id: string;
  name: string;
  model: string;
  version: string;
  linked_at: number;
  last_seen: number;
  online: boolean;
  online_since: number | null;
  /**
   * The account's role on this printer: `operator` for a printer the
   * account linked (its owner) or a share to operate it, `viewer` for a
   * share to watch it. Absent from an older console.
   */
  role?: 'operator' | 'viewer';
  /** A live share to this account, not a printer it linked. */
  shared?: boolean;
  /** When a share ends (seconds), or null. */
  ends_at?: number | null;
}

export interface CloudConfig {
  relay_url: string;
  orchestrator_id: string;
  authority_key: string;
}

export interface AccessHandoff {
  printer_id: string;
  relay_url: string;
  role: string;
  grant_id: string;
  expires_at: number;
}

export type LinkState = 'waiting' | 'awaiting_confirmation' | 'linked' | 'declined' | 'expired'

/** What `POST /token` answers: a rotating session issued to this client. */
export interface TokenSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  account?: CloudAccount;
}

export interface Approval {
  id: string;
  kind: 'link_join';
  printer_id: string;
  printer_name: string;
  link_id: string;
  role: string;
  state: 'pending' | 'allowed' | 'refused' | 'expired';
  created_at: number;
  expires_at: number;
  answered_at: number | null;
}

export interface Share {
  id: string;
  printer_id: string;
  email: string;
  role: string;
  level: string;
  ends_at: number | null;
  created_at: number;
}

export type JoinAnswer =
  | { state: 'joined', printer_id: string, share: Share }
  | { state: 'pending', printer_id: string, approval: Approval }

export class CloudError extends Error {
  constructor (message: string, readonly status: number, readonly code?: string, readonly body: Record<string, unknown> = {}) {
    super(message)
  }

  get deletionPending (): boolean {
    return this.status === 403 && this.body.deletion_pending === true
  }
}

function readStorage (key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage (key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Private mode: the session lasts as long as the tab.
  }
}

/**
 * The production console's two names (KAN-414). control.muon3d.com is its name
 * from KAN-404 on; app.muon3d.com keeps answering while printers and installed
 * apps still use it. The console serves this page under either, and both are
 * the same console: the same accounts, sessions and codes.
 */
export const CONSOLE_ORIGINS: readonly string[] = ['https://control.muon3d.com', 'https://app.muon3d.com']

/** Whether `a` and `b` are one console: the same origin, or its two names. */
export function sameConsole (a: string, b: string): boolean {
  const x = a.replace(/\/$/, '')
  const y = b.replace(/\/$/, '')
  return x === y || (CONSOLE_ORIGINS.includes(x) && CONSOLE_ORIGINS.includes(y))
}

export function cloudBaseUrl (): string {
  const saved = readStorage(URL_KEY)
  if (saved) return saved.replace(/\/$/, '')
  // A page the console serves talks to the console under the name it was
  // opened by, whichever name the build was made for: its sign-in, its cookie
  // and its redirect URI all belong to that name.
  if (CONSOLE_ORIGINS.includes(window.location.origin)) return window.location.origin
  const configured = import.meta.env.VUE_MUON_CLOUD_URL as string | undefined
  if (configured) return configured.replace(/\/$/, '')
  return window.location.origin
}

export function setCloudBaseUrl (url: string | null) {
  writeStorage(URL_KEY, url)
}

export function storedToken (): string | null {
  return readStorage(TOKEN_KEY)
}

export function storeToken (token: string | null) {
  writeStorage(TOKEN_KEY, token)
  if (token === null) clearDeletion()
}

export function storedRefreshToken (): string | null {
  return readStorage(REFRESH_KEY)
}

export function storeRefreshToken (token: string | null) {
  writeStorage(REFRESH_KEY, token)
}

/**
 * `POST /token` (RFC 6749, form-encoded). A failure is OAuth's
 * `{error, error_description}`, not the API's sentence shape.
 */
async function tokenRequest (form: Record<string, string>, signal?: AbortSignal): Promise<TokenSession> {
  let response: Response
  try {
    response = await fetch(`${cloudBaseUrl()}/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(form).toString(),
      signal
    })
  } catch {
    throw new CloudError('The Muon3D service could not be reached.', 0)
  }
  let data: any = {}
  try {
    data = await response.json()
  } catch {
    throw new CloudError('The Muon3D service sent an unreadable answer.', response.status)
  }
  if (!response.ok || typeof data.access_token !== 'string') {
    throw new CloudError(data.error_description ?? data.error ?? `The Muon3D service answered ${response.status}.`, response.status, data.error)
  }
  return data as TokenSession
}

/** What a refresh came to: a new pair, a refusal (the session is over), or no answer (it is not). */
export type RefreshOutcome = 'ok' | 'refused' | 'unreachable'

let refreshing: Promise<RefreshOutcome> | null = null

/** The lock and channel name every tab of this origin shares. */
const REFRESH_LOCK = 'muon.cloud.refresh'
/** The longest a `/token` refresh may take. A hung one must not hold every tab. */
export const REFRESH_TIMEOUT_MS = 10000
/** How long a fallback holder is believed without a release: the refresh timeout and some margin. */
const HOLD_MS = REFRESH_TIMEOUT_MS + 3000
/** Time for other tabs' claims to arrive before the fallback decides who is first. */
const CLAIM_SETTLE_MS = 50

/**
 * What to try when the console refuses a refresh, before the session is
 * dropped: the central login registers a silent `/authorize?prompt=none`
 * check. `failedRefresh` is the refresh token that was refused; the check
 * stores nothing unless that is still the stored one. True when it stored a
 * new pair.
 */
let recoverSession: ((failedRefresh: string) => Promise<boolean>) | null = null

export function setSessionRecovery (recover: ((failedRefresh: string) => Promise<boolean>) | null) {
  recoverSession = recover
}

/**
 * Runs `work` with no other tab of this origin refreshing: a refresh token
 * used twice ends its session, and the tokens sit in localStorage that every
 * tab shares. `navigator.locks` where there is one; else a BroadcastChannel
 * queue (`channelLock`).
 */
export async function withRefreshLock<T> (work: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? (navigator as any).locks : undefined
  if (locks && typeof locks.request === 'function') {
    return locks.request(REFRESH_LOCK, work) as Promise<T>
  }
  if (typeof BroadcastChannel === 'undefined') return work()
  return channelLock(work)
}

/**
 * The fallback for a browser without `navigator.locks`. Each tab announces a
 * claim with an id that sorts by time; the lowest live id holds. A claim is
 * answered once, with a `present` that nobody answers, so there is no
 * exchange to loop. A tab waits only for lower ids, each of which ends with a
 * `release` or, if its tab died, expires after HOLD_MS; so waiters run one
 * after another, and each re-reads the stored pair in `work`.
 */
async function channelLock<T> (work: () => Promise<T>): Promise<T> {
  const channel = new BroadcastChannel(REFRESH_LOCK)
  const id = `${Date.now().toString(36).padStart(10, '0')}-${Math.random().toString(36).slice(2)}`
  const others = new Map<string, number>()
  let wake: (() => void) | null = null
  channel.onmessage = (event: MessageEvent) => {
    const message = event.data as { type?: string, id?: string } | null
    if (!message || typeof message.id !== 'string' || message.id === id) return
    if (message.type === 'claim') {
      if (!others.has(message.id)) channel.postMessage({ type: 'present', id })
      others.set(message.id, Date.now() + HOLD_MS)
    } else if (message.type === 'present') {
      if (!others.has(message.id)) others.set(message.id, Date.now() + HOLD_MS)
    } else if (message.type === 'release') {
      others.delete(message.id)
    }
    wake?.()
  }
  try {
    channel.postMessage({ type: 'claim', id })
    await new Promise(resolve => setTimeout(resolve, CLAIM_SETTLE_MS))
    for (;;) {
      const now = Date.now()
      let soonest = Infinity
      let blocked = false
      for (const [other, expires] of others) {
        if (expires <= now) others.delete(other)
        else if (other < id) {
          blocked = true
          soonest = Math.min(soonest, expires)
        }
      }
      if (!blocked) break
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, Math.max(0, soonest - now))
        wake = () => { clearTimeout(timer); resolve() }
      })
      wake = null
    }
    return await work()
  } finally {
    channel.postMessage({ type: 'release', id })
    channel.close()
  }
}

/**
 * Swaps the stored refresh token for a new pair, once at a time across every
 * tab: a refresh token used twice ends its session, so two requests (here or
 * in another tab) that both met a 401 must share one refresh. Under the lock
 * the stored pair is read again; if another tab already rotated it, that new
 * pair is used and nothing is spent. When the console refuses, a silent
 * sign-in is tried once before both tokens are dropped, and only if the
 * refused token is still the stored one (a sign-out or a new sign-in since
 * leaves storage alone). A console that cannot be reached, or is too slow,
 * leaves the session as it is: `'unreachable'`.
 */
export function refreshOutcome (): Promise<RefreshOutcome> {
  const refreshToken = storedRefreshToken()
  if (!refreshToken) return Promise.resolve('refused')
  if (!refreshing) {
    refreshing = withRefreshLock(async (): Promise<RefreshOutcome> => {
      const current = storedRefreshToken()
      if (current !== refreshToken) {
        // Rotated by another tab while this one waited for the lock, or signed out.
        return current !== null && storedToken() !== null ? 'ok' : 'refused'
      }
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS)
      try {
        const session = await tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: CLIENT_ID }, controller.signal)
        storeToken(session.access_token)
        storeRefreshToken(session.refresh_token)
        return 'ok'
      } catch (error) {
        // Not reaching the console says nothing about the session.
        if (error instanceof CloudError && error.status === 0) return 'unreachable'
        try {
          if (recoverSession && storedRefreshToken() === refreshToken && await recoverSession(refreshToken)) return 'ok'
        } catch { /* fall through to dropping */ }
        if (storedRefreshToken() === refreshToken) {
          storeToken(null)
          storeRefreshToken(null)
        }
        return 'refused'
      } finally {
        clearTimeout(timer)
      }
    })
      .catch((): RefreshOutcome => 'unreachable')
      .finally(() => { refreshing = null })
  }
  return refreshing
}

/** `refreshOutcome` as a yes or no: whether there is a fresh pair to use. */
export async function refreshSession (): Promise<boolean> {
  return (await refreshOutcome()) === 'ok'
}

async function request<T> (method: string, path: string, body?: unknown, token: string | null = storedToken(), retry = true): Promise<T> {
  const startedAt = deletionRevision()
  const headers: Record<string, string> = {}
  if (token) headers.authorization = `Bearer ${token}`
  if (body !== undefined) headers['content-type'] = 'application/json'
  let response: Response
  try {
    response = await fetch(`${cloudBaseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  } catch {
    throw new CloudError('The Muon3D service could not be reached.', 0)
  }
  // A central-login access token lasts 15 minutes. Refresh once and retry;
  // only for the stored session, never for a token passed in.
  if (response.status === 401 && retry && token !== null) {
    // Another request may already have rotated the pair while this one's
    // response was in flight. Reuse that pair rather than refusing the late
    // response or spending the new refresh token again.
    const currentToken = storedToken()
    if (currentToken && token !== currentToken) {
      return request<T>(method, path, body, storedToken(), false)
    }
    if (currentToken) {
      const outcome = await refreshOutcome()
      if (outcome === 'ok') return request<T>(method, path, body, storedToken(), false)
      // The console did not answer: that is not a sign-out, so do not look like one.
      if (outcome === 'unreachable') throw new CloudError('The Muon3D service could not be reached.', 0)
    }
  }
  const text = await response.text()
  let data: any = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new CloudError('The Muon3D service sent an unreadable answer.', response.status)
  }
  if (!response.ok) {
    if (token !== null && token === storedToken()) observeDeletion(method, path, response.status, data, startedAt)
    const message = response.status === 403 && data.deletion_pending === true
      ? 'Your account is waiting to be deleted.'
      : data.error ?? `The Muon3D service answered ${response.status}.`
    throw new CloudError(message, response.status, undefined, data)
  }
  if (token !== null && token === storedToken()) observeDeletion(method, path, response.status, data, startedAt)
  return data as T
}

export const cloudApi = {
  config: () => request<CloudConfig>('GET', '/v1/config'),
  signIn: (email: string, password: string) =>
    request<{ token: string, account: CloudAccount }>('POST', '/v1/auth/sign-in', { email, password }),
  signUp: (email: string, password: string, name: string, declaredAge?: number) =>
    request<{ token: string, account: CloudAccount }>('POST', '/v1/auth/sign-up', { email, password, name, declared_age: declaredAge }),
  signOut: () => request<{ ok: boolean }>('POST', '/v1/auth/sign-out'),
  me: () => request<{ account: CloudAccount, endpoint_id: string | null }>('GET', '/v1/me'),
  /**
   * A signed assertion of this account for another Muon3D service (the
   * model service's Library), which never sees the console session. It lives
   * minutes; `expires_at` is in seconds.
   */
  assertion: (audience: string) =>
    request<{ assertion: string, expires_at: number }>('POST', '/v1/me/assertion', { audience }),
  registerEndpoint: (endpointId: string) =>
    request<{ endpoint_id: string }>('PUT', '/v1/me/endpoint', { endpoint_id: endpointId }),
  printers: () => request<{ printers: CloudPrinter[] }>('GET', '/v1/printers'),
  renamePrinter: (id: string, name: string) =>
    request<{ ok: boolean, name: string }>('PATCH', `/v1/printers/${id}`, { name }),
  unlinkPrinter: (id: string) => request<{ ok: boolean }>('DELETE', `/v1/printers/${id}`),
  access: (id: string) => request<AccessHandoff>('POST', `/v1/printers/${id}/access`),
  /** Claims the printer showing `code` on its screen. The code is the only way to link. */
  claim: (code: string) =>
    request<{ printer_id: string, name: string, state: LinkState, expires_at: number }>('POST', '/v1/links/claim', { code }),
  /** Asks a printer on this browser's network to show a link code. Links nothing by itself. */
  startLink: (printerId: string) => request<{ ok: boolean }>('POST', '/v1/links/start', { printer_id: printerId }),
  /** Printers on this browser's network, as the Muon3D service sees them. No sign-in needed. */
  nearby: () =>
    request<{ printers: Array<{ printer_id: string, name: string, model: string, linked: boolean, local_addrs?: string[] }> }>('GET', '/v1/links/nearby'),
  linkState: (id: string) => request<{ printer_id: string, state: LinkState }>('GET', `/v1/links/${id}`),
  getLayout: () => request<{ layout: any }>('GET', '/v1/fleet/layout'),
  putLayout: (layout: unknown) => request<{ ok: boolean }>('PUT', '/v1/fleet/layout', { layout }),
  /** The central login's code exchange (`WEB-12`). */
  exchangeCode: (code: string, redirectUri: string, verifier: string, signal?: AbortSignal) =>
    tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: CLIENT_ID, code_verifier: verifier }, signal),
  /**
   * A single-use code that opens the console's browser session at
   * `/handoff`. Takes the token of a session that signed in here, which is
   * never a `/token` session (those get `403`).
   */
  handoff: (token: string) =>
    request<{ code: string, url: string, expires_at: number }>('POST', '/v1/handoff', undefined, token, false),
  /** Signs in with a password for a session that is not kept: the sign-in page hands it off. */
  signInFor: (email: string, password: string) =>
    request<{ token: string, account: CloudAccount }>('POST', '/v1/auth/sign-in', { email, password, device: 'Muon3D sign-in' }, null, false),
  signUpFor: (email: string, password: string, name: string, declaredAge?: number) =>
    request<{ token: string, account: CloudAccount }>('POST', '/v1/auth/sign-up', { email, password, name, declared_age: declaredAge, device: 'Muon3D sign-in' }, null, false),
  /** Joins with an invite link's code (AB-CON-1). */
  join: (code: string) => request<JoinAnswer>('POST', `/v1/links/join/${encodeURIComponent(code)}`),
  approval: (id: string) => request<{ approval: Approval }>('GET', `/v1/approvals/${encodeURIComponent(id)}`)
}
