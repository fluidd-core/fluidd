/**
 * Personal access tokens (KAN-904): what Control's Tokens page knows. The
 * routes are muon-link-cloud's `POST/GET/DELETE /v1/tokens` (PRs #71, #72;
 * `docs/personal-access-tokens.md`, `docs/openapi/openapi-v1.yaml`). They
 * answer an interactive session only: a token calling them gets
 * `403 interactive_only`.
 *
 * A token is shown once, in the answer to the create call. Nothing here keeps
 * it: not in storage, not in the state, not in a log.
 */
import { AccountError } from './client'
import { agoText, dayText } from './model'
import type { AskMode, CreateTokenBody, PersonalToken } from './tokenTypes'

export type { TokenStatus, AskMode, PersonalToken, CreatedToken, CreateTokenBody } from './tokenTypes'

export interface ScopeInfo {
  id: string;
  /** What it lets the token do, in plain words. */
  label: string;
  /** A second line, when one helps. */
  note?: string;
  /** Putting this one on a token takes a fresh two-step code. */
  twoStep?: boolean;
}

export interface ScopeGroup {
  id: 'read' | 'change' | 'power';
  title: string;
  /** Why this group is its own. */
  blurb: string;
  /** Putting one of these on a token takes a fresh two-step code. */
  twoStep?: boolean;
  scopes: ScopeInfo[];
}

/**
 * The scopes a token can hold (the console's `PAT_GRANTABLE`), grouped by
 * what they can do to you. Anything the console later adds shows under
 * "Other" with its own name rather than being hidden.
 */
export const SCOPE_GROUPS: ScopeGroup[] = [
  {
    id: 'read',
    title: 'Look only',
    blurb: 'Can see things. Can\'t change anything.',
    scopes: [
      { id: 'printers:read', label: 'See your printers and how they\'re doing' },
      { id: 'library:read', label: 'Read your Library' },
      { id: 'design:read', label: 'Open your Design files' },
      { id: 'account:read', label: 'See your name and sign-in details' }
    ]
  },
  {
    id: 'change',
    title: 'Make changes',
    blurb: 'Can add, edit and delete your things, and stop a print. Can\'t heat or move a printer.',
    scopes: [
      { id: 'printers:files', label: 'Upload and delete print files', twoStep: true },
      { id: 'printers:queue', label: 'Line up and start prints', twoStep: true },
      { id: 'printers:estop', label: 'Emergency stop', note: 'Stops a printer at once and ends the print it is running.' },
      { id: 'library:write', label: 'Add to your Library' },
      { id: 'design:write', label: 'Change your Design files' },
      { id: 'design:export', label: 'Export from Design' },
      { id: 'slicer:run', label: 'Slice models', note: 'Uses our compute. A free allowance, then credits.' },
      { id: 'printers:camera', label: 'See camera pictures', note: 'Only on printers that have a camera.' }
    ]
  },
  {
    id: 'power',
    title: 'Act in the real world',
    blurb: 'Can heat and move a printer, or put your work in public.',
    twoStep: true,
    scopes: [
      { id: 'printers:control', label: 'Heat, move and cool your printers' },
      { id: 'library:publish', label: 'Make your models public' }
    ]
  }
]

/** Scopes that take a fresh two-step code to put on a token. */
export const SENSITIVE_SCOPES = ['printers:control', 'printers:queue', 'printers:files', 'library:publish']

/**
 * Scopes the console won't put on a token yet (it answers `409
 * not_available_yet`), because Ask and Bypass aren't enforced. The page shows
 * them as "Coming soon". The console sends no availability field today, so
 * this list is the default and the 409 teaches the page more.
 */
export const SOON_SCOPES = ['printers:control']
/** Bypass is also refused for now. */
export const BYPASS_SOON = true

/** Ticked when the form opens. */
export const DEFAULT_SCOPES = ['printers:read']

export const EXPIRY_CHOICES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 365, label: '1 year' }
]
export const DEFAULT_EXPIRY_DAYS = 30

export const BYPASS_CHOICES: Array<{ hours: 1 | 8 | null, label: string }> = [
  { hours: 1, label: '1 hour' },
  { hours: 8, label: '8 hours' },
  { hours: null, label: 'Until the token ends' }
]

const KNOWN = new Set(SCOPE_GROUPS.flatMap(g => g.scopes.map(s => s.id)))

/** Scopes a token carries that the page has no words for, so they still show. */
export function otherScopes (scopes: string[]): string[] {
  return scopes.filter(s => !KNOWN.has(s))
}

const LABELS = new Map(SCOPE_GROUPS.flatMap(g => g.scopes.map(s => [s.id, s.label] as const)))

/** A scope in words: the label, or the raw name when the page doesn't know it. */
export function scopeLabel (scope: string): string {
  return LABELS.get(scope) ?? scope
}

/** Whether making a token like this takes a fresh two-step code. */
export function needsTwoStep (scopes: string[], mode: AskMode): boolean {
  return mode === 'bypass' || scopes.some(s => SENSITIVE_SCOPES.includes(s))
}

/** "3 printers", "All your printers", "No printers". */
export function printersText (token: Pick<PersonalToken, 'printer_ids'>, name: (id: string) => string): string {
  const ids = token.printer_ids
  if (ids === null || ids === undefined) return 'All your printers'
  if (!ids.length) return 'No printers'
  if (ids.length <= 2) return ids.map(name).join(' and ')
  return `${ids.length} printers`
}

/** When a token ends: "in 29 days", "tomorrow", "ended 3 Oct". */
export function endsText (token: PersonalToken, now: number = Date.now()): string {
  const left = token.expires_at - now / 1000
  if (token.status === 'revoked') return token.revoked_at ? `Revoked ${dayText(token.revoked_at, now)}` : 'Revoked'
  if (token.status === 'expired' || left <= 0) return `Ended ${dayText(token.expires_at, now)}`
  const days = Math.ceil(left / 86400)
  if (days <= 1) return 'Ends today'
  if (days < 60) return `Ends in ${days} days`
  return `Ends ${dayText(token.expires_at, now)}`
}

/** "Never used", "Used 5 minutes ago". */
export function usedText (token: Pick<PersonalToken, 'last_used_at'>, now: number = Date.now()): string {
  if (!token.last_used_at) return 'Never used'
  const ago = agoText(token.last_used_at, now)
  return ago === 'now' ? 'Used just now' : `Used ${ago}`
}

/** "Ask mode", "Skips the click for 8 hours" (Bypass), "Skips the click". Neither is enforced yet. */
export function modeText (token: Pick<PersonalToken, 'ask_mode' | 'bypass_until'>, now: number = Date.now()): string {
  if (token.ask_mode !== 'bypass') return 'Ask mode'
  if (token.bypass_until && token.bypass_until <= now / 1000) return 'Ask mode (Bypass ended)'
  if (token.bypass_until) return `Skips the click until ${dayText(token.bypass_until, now)}`
  return 'Skips the click'
}

/** The list as the page shows it: working tokens first (newest first), then the ended ones. */
export function orderTokens (tokens: PersonalToken[]): PersonalToken[] {
  const rank = (t: PersonalToken) => (t.status === 'active' ? 0 : 1)
  return [...tokens].sort((a, b) => rank(a) - rank(b) || b.created_at - a.created_at)
}

/** The body the console wants for what the form holds. */
export function createBody (form: {
  name: string;
  scopes: string[];
  allPrinters: boolean;
  printerIds: string[];
  days: number;
  bypass: boolean;
  bypassHours: 1 | 8 | null;
}): CreateTokenBody {
  const body: CreateTokenBody = {
    name: form.name.trim(),
    scopes: [...form.scopes].sort(),
    expires_in_days: form.days,
    ask_mode: form.bypass ? 'bypass' : 'ask'
  }
  if (!form.allPrinters) body.printer_ids = [...form.printerIds]
  if (form.bypass && form.bypassHours) body.bypass_hours = form.bypassHours
  return body
}

/** A `409 not_available_yet` problem+json, whichever field carries the name. */
export function isNotAvailableYet (error: unknown): boolean {
  if (!(error instanceof AccountError) || error.status !== 409) return false
  return ['code', 'error', 'type', 'title'].some(k => {
    const v = error.body[k]
    return typeof v === 'string' && v.includes('not_available_yet')
  })
}

/**
 * A token call's error in the page's words. The console's own sentence is used
 * when it is already plain. `kind` tells the page what to do about it.
 */
export function tokenFailure (error: unknown): { text: string, kind: 'interactive' | 'two-step' | 'limit' | 'busy' | 'soon' | 'other' } {
  if (!(error instanceof AccountError)) return { text: 'Something went wrong. Try again.', kind: 'other' }
  const code = typeof error.body.code === 'string' ? error.body.code : ''
  if (error.status === 409 && isNotAvailableYet(error)) {
    return { text: 'That option isn\'t available yet. Ask and Bypass are saved but not enforced yet, so the console won\'t make a token that can heat or move a printer, or one that skips the click. Take it off and try again.', kind: 'soon' }
  }
  if (error.status === 403 && code === 'interactive_only') {
    return { text: 'Tokens are made and revoked from a signed-in browser, never with a token. Sign in here and try again.', kind: 'interactive' }
  }
  if (error.status === 403 && code === 'second_factor_required') {
    return { text: 'Turn on two-step sign-in first. A token that can heat, move or publish needs it.', kind: 'two-step' }
  }
  if (error.status === 429) {
    return { text: 'That was too many tries. Wait a few minutes, then try again.', kind: 'limit' }
  }
  if (error.status === 409 || code === 'too_many_tokens') {
    return { text: 'You have 25 working tokens, the most one account can hold. Revoke one you don\'t use, then try again.', kind: 'limit' }
  }
  return { text: error.message, kind: 'other' }
}
