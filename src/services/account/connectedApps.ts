/**
 * Connected apps (KAN-905, remote access phase 2): the apps a person let into
 * their account with OAuth. Muon's own (the slicer, the Library) and apps
 * that registered themselves, such as an MCP client. Personal access tokens
 * are not here; they have their own page.
 *
 * The routes are the console's `GET /v1/me/connected-apps` and
 * `DELETE /v1/me/connected-apps/{client_id}` (console-api contract, 27 Oct
 * 2026; muon-link-cloud KAN-905 phase 2). They answer a signed-in session
 * only. `name`, `client_uri` and `redirect_hosts` are what the app said about
 * itself: the page shows them as text, never as HTML, and never loads
 * `logo_uri`.
 */
import { AccountError } from './client'
import { agoText, dayText } from './model'
import { scopeLabel, SENSITIVE_SCOPES } from './tokens'
import type { ConnectedApp } from './connectedAppTypes'

export type { ConnectedApp } from './connectedAppTypes'

/** What the page calls an app with no name left. */
export function appName (app: Pick<ConnectedApp, 'name'>): string {
  return app.name?.trim() || 'An app that no longer exists'
}

/** A loopback redirect is a program on the person's own device, not a website. */
export function isLoopback (host: string | null | undefined): boolean {
  if (!host) return false
  const lower = host.toLowerCase()
  const bare = lower.startsWith('[') ? lower.slice(1, lower.indexOf(']')) : lower.replace(/:\d+$/, '')
  return bare === 'localhost' || bare === '::1' || /^127(\.\d{1,3}){3}$/.test(bare)
}

/** "claude.ai", "A program on your computer", "claude.ai and a program on your computer". */
export function whereText (app: Pick<ConnectedApp, 'redirect_hosts'>): string {
  const hosts = app.redirect_hosts ?? []
  const sites = [...new Set(hosts.filter(h => !isLoopback(h)))]
  const local = hosts.some(isLoopback)
  const parts = sites.length > 2 ? [`${sites.length} websites`] : [...sites]
  if (local) parts.push(parts.length ? 'a program on your computer' : 'A program on your computer')
  if (!parts.length) return 'Nowhere it named'
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

/** The app's own site as a host, when it named one and it isn't already shown. */
export function siteText (app: Pick<ConnectedApp, 'client_uri' | 'redirect_hosts'>): string {
  if (!app.client_uri) return ''
  try {
    const host = new URL(app.client_uri).host
    return (app.redirect_hosts ?? []).includes(host) ? '' : host
  } catch {
    return ''
  }
}

/** "Approved 3 Oct", or "Signed in, never approved here" for a session with no approval row. */
export function approvedText (app: Pick<ConnectedApp, 'approved_at'>, now: number = Date.now()): string {
  return app.approved_at ? `Approved ${dayText(app.approved_at, now)}` : 'No approval on record'
}

/** "Not signed in", "Used 5 minutes ago", "Used 3 Oct · 2 sessions". */
export function lastUsedText (app: Pick<ConnectedApp, 'last_used_at' | 'sessions'>, now: number = Date.now()): string {
  if (!app.last_used_at || !app.sessions) return 'Not signed in now'
  const ago = agoText(app.last_used_at, now)
  const when = ago === 'now' ? 'Used just now' : `Used ${ago}`
  return app.sessions > 1 ? `${when} · signed in ${app.sessions} times` : when
}

/** A scope as the page lists it, and whether it can act in the real world. */
export function appScopes (app: Pick<ConnectedApp, 'scopes'>): Array<{ id: string, label: string, power: boolean }> {
  return (app.scopes ?? []).map(id => ({ id, label: scopeLabel(id), power: SENSITIVE_SCOPES.includes(id) }))
}

/** This page's own app first, then as the console sent them (newest approval first). */
export function orderApps (apps: ConnectedApp[]): ConnectedApp[] {
  return [...apps].sort((a, b) => Number(b.current) - Number(a.current))
}

/** A connected-apps call's error in the page's words (the console's legacy `{error, code}`). */
export function appFailure (error: unknown): string {
  if (!(error instanceof AccountError)) return 'Something went wrong. Try again.'
  const code = typeof error.body.code === 'string' ? error.body.code : ''
  if (error.status === 409 && code === 'current_app') {
    return 'That is the app you are using now. To end it, sign out instead.'
  }
  if (error.status === 404) return 'That app was already disconnected.'
  if (error.status === 403 && (code === 'interactive_only' || code === 'insufficient_scope')) {
    return 'Connected apps are managed from a signed-in browser, never with a token. Sign in here and try again.'
  }
  if (error.status === 429) return 'That was too many tries. Wait a few minutes, then try again.'
  return error.message
}
