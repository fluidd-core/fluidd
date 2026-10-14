/**
 * The Muon3D account console's HTTP API.
 *
 * Fluidd is served either by the printer (LAN) or by the console itself. In
 * both cases the console is reached at `cloudBaseUrl()`: the page's own origin
 * when the console serves Fluidd, or the URL saved in `muon.cloud.url`.
 */

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
  constructor (message: string, readonly status: number, readonly code?: string) {
    super(message)
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
async function tokenRequest (form: Record<string, string>): Promise<TokenSession> {
  let response: Response
  try {
    response = await fetch(`${cloudBaseUrl()}/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(form).toString()
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

let refreshing: Promise<boolean> | null = null

/**
 * Swaps the stored refresh token for a new pair, once at a time: a refresh
 * token used twice ends its session, so two requests that both met a 401
 * must share one refresh. False when there is nothing to refresh with, or
 * the console refused, and then both tokens are dropped.
 */
export function refreshSession (): Promise<boolean> {
  const refreshToken = storedRefreshToken()
  if (!refreshToken) return Promise.resolve(false)
  if (!refreshing) {
    refreshing = tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: CLIENT_ID })
      .then((session) => {
        storeToken(session.access_token)
        storeRefreshToken(session.refresh_token)
        return true
      })
      .catch(() => {
        storeToken(null)
        storeRefreshToken(null)
        return false
      })
      .finally(() => { refreshing = null })
  }
  return refreshing
}

async function request<T> (method: string, path: string, body?: unknown, token: string | null = storedToken(), retry = true): Promise<T> {
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
    if (currentToken && (token !== currentToken || await refreshSession())) {
      return request<T>(method, path, body, storedToken(), false)
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
    throw new CloudError(data.error ?? `The Muon3D service answered ${response.status}.`, response.status)
  }
  return data as T
}

export const cloudApi = {
  config: () => request<CloudConfig>('GET', '/v1/config'),
  signIn: (email: string, password: string) =>
    request<{ token: string, account: CloudAccount }>('POST', '/v1/auth/sign-in', { email, password }),
  signUp: (email: string, password: string, name: string) =>
    request<{ token: string, account: CloudAccount }>('POST', '/v1/auth/sign-up', { email, password, name }),
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
  exchangeCode: (code: string, redirectUri: string, verifier: string) =>
    tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: CLIENT_ID, code_verifier: verifier }),
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
  signUpFor: (email: string, password: string, name: string) =>
    request<{ token: string, account: CloudAccount }>('POST', '/v1/auth/sign-up', { email, password, name, device: 'Muon3D sign-in' }, null, false),
  /** Joins with an invite link's code (AB-CON-1). */
  join: (code: string) => request<JoinAnswer>('POST', `/v1/links/join/${encodeURIComponent(code)}`),
  approval: (id: string) => request<{ approval: Approval }>('GET', `/v1/approvals/${encodeURIComponent(id)}`)
}
