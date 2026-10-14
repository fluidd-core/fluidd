/**
 * The central login (`WEB-12`, muon-link-cloud#15, `crates/muon-console/src/
 * http.rs` "The central login"), from Fluidd's side.
 *
 * Only where the console serves this page: its client registration names the
 * console's own origin as the redirect URI, so a Fluidd served by a printer
 * keeps signing in with a password as before.
 *
 * 1. With no session, the page goes top level to `/authorize` with PKCE S256
 *    and `prompt=none`, once per tab. Signed in at the console, it comes
 *    straight back with a code. If not, it comes back with `login_required`,
 *    and Fluidd shows its own "Sign in", which goes to `/authorize` without
 *    `prompt=none`.
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
import { CLIENT_ID, cloudBaseUrl, sameConsole, storedToken } from './api'
import { challengeFor, newState, newVerifier } from './pkce'

const PENDING_KEY = 'muon.cloud.authorize'
const SILENT_KEY = 'muon.cloud.silent'

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
  go(await prepareAuthorize(options))
}

/**
 * Remembers a new PKCE verifier and `state` for this tab, and answers the
 * `/authorize` URL that goes with them.
 */
export async function prepareAuthorize (options: { silent: boolean, returnTo?: string }): Promise<string> {
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

/** Whether to try `prompt=none` before anything else loads. */
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
  const url = sameConsole(given.origin, base) ? new URL(`${given.pathname}${given.search}`, base) : given
  url.searchParams.set('next', next ?? '/')
  return url.toString()
}

/**
 * Signs out of the console: a form post to `/logout`, which ends the browser
 * session and every session issued from it, and comes back here.
 */
export function signOutCentral (doc: Document = document): void {
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
  session()?.removeItem(SILENT_KEY)
}
