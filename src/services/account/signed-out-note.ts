/**
 * What this tab remembers across the console's `/logout` (KAN-532): that it
 * signed out a moment ago, where, and whether the person wants to change
 * their password next, so the signed-out page can say so.
 *
 * The console sends a signed-out browser back to `/`, as it always has, and
 * the `/` route goes on to `/signed-out` while this is fresh. No imports: the
 * router reads it, and anything that opens printers would be a cycle there.
 */

/** Where the person signed out: this browser, every device, or the account went. */
export type SignedOutScope = 'browser' | 'everywhere' | 'deleted'

export interface SignedOutNote {
  /** Milliseconds since 1970. */
  at: number;
  scope: SignedOutScope;
  /** The address that was signed out, for the page to name. */
  email?: string;
  /** "Change my password next" was ticked. */
  password?: boolean;
}

export const SIGNED_OUT_KEY = 'muon.account.signedOut'

/** Long enough for the console's logout page and its two-second wait. */
const FRESH_MS = 2 * 60 * 1000

function tab (): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function noteSignedOut (note: Omit<SignedOutNote, 'at'>, now = Date.now()): void {
  try {
    tab()?.setItem(SIGNED_OUT_KEY, JSON.stringify({ ...note, at: now }))
  } catch { /* the page then says less */ }
}

/** The note, if this tab signed out in the last two minutes. */
export function readSignedOut (now = Date.now()): SignedOutNote | null {
  try {
    const raw = tab()?.getItem(SIGNED_OUT_KEY)
    if (!raw) return null
    const note = JSON.parse(raw) as SignedOutNote
    if (typeof note?.at !== 'number' || now - note.at > FRESH_MS || now < note.at) return null
    if (!['browser', 'everywhere', 'deleted'].includes(note.scope)) return null
    return note
  } catch {
    return null
  }
}

export function forgetSignedOut (): void {
  try {
    tab()?.removeItem(SIGNED_OUT_KEY)
  } catch { /* nothing to forget */ }
}
