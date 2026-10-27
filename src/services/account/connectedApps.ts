/**
 * Connected apps (KAN-905, remote access phase 2): the AI tools and other
 * programs a person let into their account through the console's OAuth
 * consent page, MCP clients among them. The console's routes are
 * `GET /v1/connections` and `DELETE /v1/connections/{id}`; like the token
 * routes they answer a signed-in session only.
 *
 * PROVISIONAL: the console API for this list is not built yet
 * (muon-link-cloud `docs/mcp-server.md`, "Next" 1). The shape below follows
 * what the consent page already shows and what the token list returns. The
 * page treats a 404 as "not here yet", so it is safe against a console that
 * lacks the routes.
 */
import { AccountError } from './client'
import { agoText, dayText } from './model'
import { scopeLabel, SENSITIVE_SCOPES } from './tokens'
import type { AskMode } from './tokenTypes'

/** One app as `GET /v1/connections` lists it. Times are seconds. */
export interface ConnectedApp {
  /** The approval's id: what revoking names. */
  id: string;
  client_id: string;
  /** The name the app gave itself. Muon3D has not checked it unless `verified`. */
  name: string;
  /** `mcp`: it reaches the account through mcp.muon3d.com. `oauth`: the API directly. */
  kind: 'mcp' | 'oauth';
  /** Registered by Muon3D (true), or registered itself (false, the usual case for an AI tool). */
  verified: boolean;
  /** Where the console sends the person back after approving: a host, or a loopback address. */
  redirect_host: string | null;
  /** The app's own site, when it gave one. */
  client_uri?: string | null;
  /** What it was approved for. */
  scopes: string[];
  ask_mode: AskMode;
  bypass_until?: number | null;
  approved_at: number;
  last_used_at?: number | null;
  /** How it was last used: `mcp` through the MCP server, `api` directly. */
  last_used_via?: 'api' | 'mcp' | null;
}

/** Newest use first; an app never used sorts by when it was approved. */
export function orderApps (apps: ConnectedApp[]): ConnectedApp[] {
  const seen = (a: ConnectedApp) => a.last_used_at ?? a.approved_at
  return [...apps].sort((a, b) => seen(b) - seen(a))
}

/** A loopback redirect is a program on the person's own device, not a website. */
export function isLoopback (host: string | null | undefined): boolean {
  if (!host) return false
  const lower = host.toLowerCase()
  const bare = lower.startsWith('[') ? lower.slice(1, lower.indexOf(']')) : lower.replace(/:\d+$/, '')
  return bare === 'localhost' || bare === '::1' || /^127(\.\d{1,3}){3}$/.test(bare)
}

/** "A program on this device", "claude.ai", or "Unknown". */
export function whereText (app: Pick<ConnectedApp, 'redirect_host'>): string {
  if (!app.redirect_host) return 'Unknown'
  return isLoopback(app.redirect_host) ? 'A program on your computer' : app.redirect_host
}

/** "Through MCP", "Through the API". */
export function kindText (app: Pick<ConnectedApp, 'kind'>): string {
  return app.kind === 'mcp' ? 'Through MCP' : 'Through the API'
}

/** "Approved 3 Oct". */
export function approvedText (app: Pick<ConnectedApp, 'approved_at'>, now: number = Date.now()): string {
  return `Approved ${dayText(app.approved_at, now)}`
}

/** "Never used", "Used 5 minutes ago through MCP". */
export function lastUsedText (app: Pick<ConnectedApp, 'last_used_at' | 'last_used_via'>, now: number = Date.now()): string {
  if (!app.last_used_at) return 'Never used'
  const ago = agoText(app.last_used_at, now)
  const when = ago === 'now' ? 'Used just now' : `Used ${ago}`
  if (app.last_used_via === 'mcp') return `${when} through MCP`
  if (app.last_used_via === 'api') return `${when} through the API`
  return when
}

/** Whether Bypass is on now: on, and not past its end. */
export function bypassOn (app: Pick<ConnectedApp, 'ask_mode' | 'bypass_until'>, now: number = Date.now()): boolean {
  if (app.ask_mode !== 'bypass') return false
  return !app.bypass_until || app.bypass_until > now / 1000
}

/** The Ask/Bypass line under the switch. Neither is enforced yet. */
export function askText (app: Pick<ConnectedApp, 'ask_mode' | 'bypass_until'>, now: number = Date.now()): string {
  if (app.ask_mode === 'bypass' && !bypassOn(app, now)) return 'Asks you first (Bypass ended)'
  if (bypassOn(app, now)) {
    return app.bypass_until
      ? `Acts without asking until ${dayText(app.bypass_until, now)}`
      : 'Acts without asking'
  }
  return 'Asks you first'
}

/** A scope as the page lists it, with whether it can act in the real world. */
export function appScopes (app: Pick<ConnectedApp, 'scopes'>): Array<{ id: string, label: string, power: boolean }> {
  return app.scopes.map(id => ({ id, label: scopeLabel(id), power: SENSITIVE_SCOPES.includes(id) }))
}

/** A connections call's error in the page's words. */
export function appFailure (error: unknown): string {
  if (!(error instanceof AccountError)) return 'Something went wrong. Try again.'
  const code = typeof error.body.code === 'string' ? error.body.code : ''
  if (error.status === 403 && code === 'interactive_only') {
    return 'Connected apps are managed from a signed-in browser, never with a token. Sign in here and try again.'
  }
  if (error.status === 429) return 'That was too many tries. Wait a few minutes, then try again.'
  return error.message
}
