/**
 * The central login (`WEB-12`, muon-link-cloud#15, `crates/muon-console/src/
 * http.rs` "The central login"), from Fluidd's side.
 *
 * Only where the console serves this page: its client registration names the
 * console's own origin as the redirect URI, so a Fluidd served by a printer
 * keeps signing in with a password as before.
 *
 * 1. With no session, a same-origin fetch follows `/authorize?prompt=none`
 *    once per tab, alongside app initialization. Its final URL carries a
 *    code or `login_required`; the fetched HTML is never executed. The
 *    current document stays visible. Explicit sign-in still navigates.
 * 2. Back at the redirect URI, the `code` is exchanged at `POST /token` with
 *    the verifier. `state` must be the one this tab sent, and `iss` (RFC 9207)
 *    the console's own URL (either of its names, KAN-414), or nothing is
 *    exchanged.
 * 3. Signing out is a form post to `/logout`, which ends the browser session
 *    and every session issued from it, and loads each surface's front-channel
 *    logout page. Fluidd's is `auth/logout.html`.
 *
 * The console's own sign-in page, which `/authorize` sends a browser to with
 * `continue`, is `views/SignIn.vue`; `safeContinue` below is its guard.
 */
import { CLIENT_ID, cloudApi, cloudBaseUrl, sameConsole, setSessionRecovery, storedRefreshToken, storedToken, storeToken, storeRefreshToken } from './api'
import { challengeFor, newState, newVerifier } from './pkce'
import { refreshServiceWorker } from '@/util/service-worker-update'

const PENDING_KEY = 'muon.cloud.authorize'
const SILENT_KEY = 'muon.cloud.silent'
// Explicit sign-in/out supersedes any asynchronous silent check in flight.
let signInRevision = 0

/** What a tab remembers across the trip to `/authorize`. */
interface Pending {
  state: string;
  verifier: string;
  /** The address on this page to come back to, such as `/join?code=...`. */
  returnTo: string;
  silent: boolean;
}

export type CallbackResult =
  | { outcome: 'none' }
  | { outcome: 'code', code: string, verifier: string, returnTo: string }
  /** `prompt=none` found no browser session: show "Sign in". */
  | { outcome: 'signed_out', returnTo: string }
  | { outcome: 'error', message: string, returnTo: string }

function session (): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

/** Whether this page signs in through the central login: the console serves it. */
export function centralLoginEnabled (location: Pick<Location, 'origin' | 'protocol' | 'hostname'> = window.location): boolean {
  if (cloudBaseUrl() !== location.origin) return false
  return location.protocol === 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
}

/** The registered redirect URI: the console's root, where Fluidd is served. */
export function redirectUri (origin: string = window.location.origin): string {
  return `${origin}/`
}

export function authorizeUrl (base: string, params: { redirectUri: string, challenge: string, state: string, silent: boolean }): string {
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: params.redirectUri,
    code_challenge: params.challenge,
    code_challenge_method: 'S256',
    state: params.state
  })
  if (params.silent) query.set('prompt', 'none')
  return `${base}/authorize?${query.toString()}`
}

/**
 * An address on this page to return to after signing in: a path such as
 * `/join?code=X`, never another origin (`//host`, `/\host`), whitespace or a
 * scheme. A hash route (`#/join?code=X`), which a tab that started signing in
 * on an older Fluidd remembers, becomes its path. Anything else is `/`.
 */
export function safeReturnTo (value: string): string {
  const path = value.startsWith('#/') ? value.slice(1) : value
  return /^\/[^\s\\]*$/.test(path) && !path.startsWith('//') ? path : '/'
}

/** Where this page is now, to come back to: its path, query and fragment. */
function currentAddress (): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

/**
 * Goes to `/authorize`. `silent` asks with `prompt=none`, and is tried at
 * most once per tab, so a console that says `login_required` is never asked
 * again in a loop.
 */
export async function startCentralSignIn (options: { silent: boolean, returnTo?: string }, go: (url: string) => void = (url) => window.location.assign(url)): Promise<void> {
  const url = await prepareAuthorize(options)
  // An older worker may answer /authorize with its cached printers page.
  if (!options.silent) await refreshServiceWorker()
  go(url)
}

/**
 * Remembers a new PKCE verifier and `state` for this tab, and answers the
 * `/authorize` URL that goes with them.
 */
export async function prepareAuthorize (options: { silent: boolean, returnTo?: string }): Promise<string> {
  signInRevision++
  const verifier = newVerifier()
  const state = newState()
  const pending: Pending = {
    state,
    verifier,
    returnTo: safeReturnTo(options.returnTo ?? currentAddress()),
    silent: options.silent
  }
  const store = session()
  store?.setItem(PENDING_KEY, JSON.stringify(pending))
  if (options.silent) store?.setItem(SILENT_KEY, '1')
  return authorizeUrl(cloudBaseUrl(), {
    redirectUri: redirectUri(),
    challenge: await challengeFor(verifier),
    state,
    silent: options.silent
  })
}

/**
 * Whether an address is a return from `/authorize`: it carries the `state`
 * this page sent, with a `code` or an `error`. A page's own `code` (the
 * invite on /join?code=, the link code on /link?code=) comes without one.
 */
export function isAuthCallback (search: string): boolean {
  const query = new URLSearchParams(search)
  return query.has('state') && (query.has('code') || query.has('error'))
}

/** Whether to try a background `prompt=none` check on this load. */
export function shouldTrySilentSignIn (location: Pick<Location, 'origin' | 'protocol' | 'hostname' | 'search' | 'pathname'> = window.location): boolean {
  if (!centralLoginEnabled(location)) return false
  if (storedToken()) return false
  if (session()?.getItem(SILENT_KEY)) return false
  // A page's own code too (/join?code=): that page signs in for itself.
  const query = new URLSearchParams(location.search)
  if (query.has('code') || query.has('error')) return false
  // The console's own sign-in page is where `/authorize` sends a browser
  // with no session; asking `/authorize` from there would only come back
  // signed out and lose `continue`. Setup never talks to the console.
  return !/^\/(sign-in|setup)(?:\/|$)/.test(location.pathname)
}

/**
 * Uses the existing console contract without replacing this document. Only
 * the console's own origin can use its host-only, HttpOnly, Lax cookie here;
 * mode=same-origin also refuses a redirect crossing to any other origin.
 * PKCE/state stay in memory, separate from an explicit sign-in's callback.
 * A failed/unsupported check leaves the app usable and never navigates.
 */
export async function checkCentralSession (): Promise<void> {
  if (!shouldTrySilentSignIn() || session()?.getItem(PENDING_KEY)) return
  session()?.setItem(SILENT_KEY, '1')
  await silentSignIn(null)
}

/**
 * One `/authorize?prompt=none` fetch and, if it answers with a code, the
 * exchange. True when a new pair was stored. `failedRefresh` is for a session
 * whose refresh was refused: the dead pair is still stored then, and is
 * replaced, but only while it is still the stored one, so a sign-out or
 * another sign-in in the meantime is never overwritten.
 */
async function silentSignIn (failedRefresh: string | null): Promise<boolean> {
  const revision = ++signInRevision
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 5000)
  const current = () => revision === signInRevision && !controller.signal.aborted && (failedRefresh === null ? !storedToken() : storedRefreshToken() === failedRefresh)
  try {
    const verifier = newVerifier()
    const state = newState()
    const base = cloudBaseUrl()
    const callback = redirectUri()
    const response = await fetch(authorizeUrl(base, {
      redirectUri: callback,
      challenge: await challengeFor(verifier),
      state,
      silent: true
    }), {
      credentials: 'same-origin',
      mode: 'same-origin',
      redirect: 'follow',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      signal: controller.signal
    })
    // Only headers and the URL matter. Do not download/parse another app.
    await response.body?.cancel()
    if (!current() || cloudBaseUrl() !== base || !response.ok || !response.redirected) return false
    const url = new URL(response.url)
    if (`${url.origin}${url.pathname}` !== callback || url.hash) return false
    const query = url.searchParams
    if (query.getAll('state').length !== 1 || query.get('state') !== state) return false
    if (query.getAll('iss').length !== 1 || !sameConsole(query.get('iss')!, base)) return false
    // login_required and every other OAuth error leave sign-in to the user.
    if (query.has('error') || query.getAll('code').length !== 1 || !query.get('code')) return false
    const tokens = await cloudApi.exchangeCode(query.get('code')!, callback, verifier, controller.signal)
    if (!current() || cloudBaseUrl() !== base) return false
    storeToken(tokens.access_token)
    storeRefreshToken(tokens.refresh_token)
    return true
  } catch {
    // offline, timeout, denied or unsupported: keep the app usable
    return false
  } finally {
    window.clearTimeout(timeout)
  }
}

/** Least time between two recoveries in a tab, so a console that keeps refusing is not asked in a loop. */
const RECOVERY_GAP_MS = 60000
let lastRecovery = 0

/**
 * After the console refused a refresh: the browser session may still be
 * alive, and `/authorize?prompt=none` then issues a new pair without a
 * sign-in page (KAN-932). Once per minute per tab; only where the console
 * serves this page.
 */
export async function recoverCentralSession (failedRefresh: string, now: number = Date.now()): Promise<boolean> {
  if (!centralLoginEnabled()) return false
  if (lastRecovery && now - lastRecovery < RECOVERY_GAP_MS) return false
  lastRecovery = now
  return silentSignIn(failedRefresh)
}

/** For tests. */
export function resetRecovery (): void {
  lastRecovery = 0
}

setSessionRecovery((failedRefresh) => recoverCentralSession(failedRefresh))

/**
 * Reads a return from `/authorize` off the address, if this is one, and
 * puts the address back to where the trip started. Pure but for the tab's
 * own storage and the history entry it rewrites.
 */
export function takeCallback (location: Pick<Location, 'search'> = window.location, consoleUrl: string = cloudBaseUrl()): CallbackResult {
  if (!isAuthCallback(location.search)) return { outcome: 'none' }
  const query = new URLSearchParams(location.search)

  const store = session()
  let pending: Pending | null = null
  try {
    pending = JSON.parse(store?.getItem(PENDING_KEY) ?? 'null')
  } catch { /* unreadable: treated as none */ }
  store?.removeItem(PENDING_KEY)

  const returnTo = safeReturnTo(pending?.returnTo ?? '/')
  try {
    window.history.replaceState(window.history.state, '', `${window.location.origin}${returnTo}`)
  } catch { /* tests */ }

  if (!pending || query.get('state') !== pending.state) {
    return { outcome: 'error', message: 'That sign-in did not start here. Sign in again.', returnTo }
  }
  // The console names itself by one URL (MUON_CONSOLE_URL) whichever of its
  // two names it was reached by (KAN-414), so either name is this console.
  const iss = query.get('iss')
  if (iss === null || !sameConsole(iss, consoleUrl)) {
    return { outcome: 'error', message: 'That sign-in came from the wrong place. Sign in again.', returnTo }
  }

  const error = query.get('error')
  if (error === 'login_required' && pending.silent) return { outcome: 'signed_out', returnTo }
  if (error) return { outcome: 'error', message: query.get('error_description') || `Sign-in failed (${error}).`, returnTo }

  const code = query.get('code') ?? ''
  if (!code) return { outcome: 'error', message: 'Sign-in failed.', returnTo }
  return { outcome: 'code', code, verifier: pending.verifier, returnTo }
}

/**
 * The console's sign-in page follows `continue` only to the console's own
 * `/authorize`: a path beginning `/authorize?`, and nothing a browser could
 * read as another origin (`//host`, `/\host`) or another scheme.
 */
export function safeContinue (value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/authorize?')) return null
  // No whitespace, control characters or backslashes, which browsers fold
  // into a path in ways that can change its meaning.
  // eslint-disable-next-line no-control-regex
  if (/[\s\\\u0000-\u001f\u007f]/.test(value)) return null
  return value
}

/**
 * Where the sign-in page sends the browser once it holds a handoff: the
 * console's `/handoff`, carrying `continue` on as `next`. The console names
 * the handoff by its own URL; under its other name (KAN-414) the browser stays
 * on the name this page uses, where the session cookie and `/authorize` are.
 */
export function handoffUrl (handoff: string, next: string | null): string {
  const base = cloudBaseUrl()
  const given = new URL(handoff, base)
  if (!sameConsole(given.origin, base)) throw new Error('The sign-in handoff came from the wrong origin.')
  const url = new URL(`${given.pathname}${given.search}`, base)
  url.searchParams.set('next', next ?? '/')
  return url.toString()
}

/**
 * Signs out of the console: a form post to `/logout`, which ends the browser
 * session and every session issued from it, and comes back here.
 */
export function signOutCentral (doc: Document = document): void {
  signInRevision++
  session()?.setItem(SILENT_KEY, '1')
  const form = doc.createElement('form')
  form.method = 'POST'
  form.action = `${cloudBaseUrl()}/logout`
  form.style.display = 'none'
  for (const [name, value] of Object.entries({ client_id: CLIENT_ID, post_logout_redirect_uri: redirectUri() })) {
    const input = doc.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }
  doc.body.appendChild(form)
  form.submit()
}

/** Forgets this tab's silent attempt, after an explicit sign-in succeeds. */
export function clearSilentAttempt (): void {
  signInRevision++
  session()?.removeItem(SILENT_KEY)
}
