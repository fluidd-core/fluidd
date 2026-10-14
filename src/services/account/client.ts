/**
 * Requests to the account console for the Account pages (KAN-532), beside
 * the muon-cloud client (`services/muon-cloud/api.ts`), which the printer
 * pages use. The same console, the same stored session and the same
 * refresh-once on a 401; what this adds is the answer's whole body on an
 * error, because the console says more than a sentence there:
 * `reauth_required` (confirm it's you), `mfa_required` with an `mfa_token`
 * (a two-step sign-in), and nothing at all for a route it doesn't have yet.
 *
 * A console older than the Account pages answers a route it lacks with a
 * 404 or 405 and no JSON error. `AccountError.missing` says so, and the
 * pages show "Coming soon" there instead of an error.
 */
import { CloudError, cloudBaseUrl, refreshSession, storedToken } from '@/services/muon-cloud/api'
import { deletionRevision, observeDeletion } from '@/services/muon-cloud/deletion'

export class AccountError extends CloudError {
  constructor (message: string, status: number, body: Record<string, unknown> = {}) {
    super(message, status, undefined, body)
  }

  /** The console wants the person to confirm it's them (`403 reauth_required`). */
  get reauthRequired (): boolean {
    return this.status === 403 && this.body.reauth_required === true
  }

  /** A sign-in that needs a two-step code: the token to send with it. */
  get mfaToken (): string | null {
    return this.status === 403 && this.body.mfa_required === true && typeof this.body.mfa_token === 'string'
      ? this.body.mfa_token
      : null
  }

  /** The console doesn't have this route yet (an older build): no JSON error with it. */
  get missing (): boolean {
    return [404, 405, 501].includes(this.status) && typeof this.body.error !== 'string'
  }
}

/** Whether an error is an AccountError for a route the console doesn't have yet. */
export function isMissing (error: unknown): boolean {
  return error instanceof AccountError && error.missing
}

export interface RequestOptions {
  /** A token other than the stored session's (the sign-in page's own). Never refreshed. */
  token?: string | null;
  /** Answer the raw response (a download), not its JSON. */
  raw?: boolean;
}

async function send (method: string, path: string, body: unknown, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {}
  if (token) headers.authorization = `Bearer ${token}`
  if (body !== undefined) headers['content-type'] = 'application/json'
  try {
    return await fetch(`${cloudBaseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  } catch {
    throw new AccountError('The Muon3D service could not be reached.', 0)
  }
}

async function errorOf (response: Response): Promise<AccountError> {
  let data: Record<string, unknown> = {}
  try {
    const text = await response.text()
    const parsed = text ? JSON.parse(text) : {}
    if (parsed && typeof parsed === 'object') data = parsed
  } catch { /* an HTML 404 from a console without the route: `missing` */ }
  const message = typeof data.error === 'string' ? sentence(data.error) : `The Muon3D service answered ${response.status}.`
  return new AccountError(message, response.status, data)
}

/** The console's errors are lower-case clauses ("that code is not right"): shown as sentences. */
export function sentence (text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  const first = trimmed[0].toUpperCase() + trimmed.slice(1)
  return /[.!?]$/.test(first) ? first : `${first}.`
}

export async function accountRequest<T> (method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  let startedAt = deletionRevision()
  const ownToken = options.token !== undefined
  let token = ownToken ? options.token ?? null : storedToken()
  let response = await send(method, path, body, token)
  // A central-login access token lasts 15 minutes: refresh once and retry,
  // only for the stored session (services/muon-cloud/api.ts does the same).
  if (response.status === 401 && !ownToken && token !== null) {
    const current = storedToken()
    if (current && (current !== token || await refreshSession())) {
      token = storedToken()
      startedAt = deletionRevision()
      response = await send(method, path, body, token)
    }
  }
  if (!response.ok) {
    const error = await errorOf(response)
    if (!ownToken && token !== null && token === storedToken()) observeDeletion(method, path, response.status, error.body, startedAt)
    throw error
  }
  if (options.raw) return response as unknown as T
  const text = await response.text()
  try {
    const data = text ? JSON.parse(text) : {}
    if (!ownToken && token !== null && token === storedToken()) observeDeletion(method, path, response.status, data, startedAt)
    return data as T
  } catch {
    throw new AccountError('The Muon3D service sent an unreadable answer.', response.status)
  }
}
