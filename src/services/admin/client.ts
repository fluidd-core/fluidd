import { cloudBaseUrl, storedToken, refreshSession } from '@/services/muon-cloud/api'
import { usePasskey } from '@/services/account/webauthn'

export interface StaffSession { actor: string; staff_expires_at: number }
export interface AdminAccount {
  id: string; name: string; email: string; email_verified: boolean;
  created_at: number; delete_after: number | null; sessions: number;
  admin_version?: number; staff_suspended?: boolean;
}
export interface Lookup { account: AdminAccount | null; staff_expires_at: number }
export interface AuditEntry { id: number; actor: string; action: string; target?: string | null; reason: string; result: string; at: number }
export interface AuditPage { entries: AuditEntry[]; next: number | null; staff_expires_at?: number }
export class AdminError extends Error {
  constructor (message: string, readonly status: number, readonly expired = false) { super(message) }
}
const MODELS = 'https://models.muon3d.com'

export function adminAvailable (page = window.location.href, console = cloudBaseUrl()): boolean {
  const origin = new URL(page).origin
  return ['https://control.muon3d.com', 'https://app.muon3d.com'].includes(origin) && console === origin
}

async function send<T> (origin: string, path: string, token: string, body: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${origin}${path}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer'
    })
  } catch { throw new AdminError('Staff tools could not be reached. Try again.', 0) }
  let data: any
  try { data = JSON.parse(await response.text()) } catch { throw new AdminError('Staff tools sent an unreadable answer.', response.status) }
  if (!response.ok) {
    const expired = response.status === 401 || data.staff_reauth_required === true
    throw new AdminError(expired
      ? 'Confirm staff access again.'
      : response.status === 403
        ? 'Staff access is required on Control.'
        : response.status === 429
          ? 'Too many requests. Try again in a minute.'
          : 'The request could not be completed. Check your details and try again.', response.status, expired)
  }
  return data as T
}

async function consoleRequest<T> (path: string, body: unknown, retry401 = true): Promise<T> {
  if (!adminAvailable()) throw new AdminError('Open staff tools on Control.', 403)
  let token = storedToken()
  if (!token) throw new AdminError('Sign in to use staff tools.', 401, true)
  try { return await send<T>(cloudBaseUrl(), path, token, body) } catch (error) {
    if (!retry401 || !(error instanceof AdminError) || error.status !== 401 || !await refreshSession()) throw error
    token = storedToken()
    if (!token) throw error
    return await send<T>(cloudBaseUrl(), path, token, body)
  }
}

/** A real #36 ceremony, explicitly for staff; membership is checked afterwards. */
export async function confirmStaff (): Promise<StaffSession> {
  const options = await consoleRequest<{ ceremony_id: string; options: { publicKey: Record<string, any> }; expires_at: number }>(
    '/v1/me/reauth/passkey/options', { purpose: 'staff' })
  const check = () => {
    if (options.expires_at * 1000 <= Date.now()) throw new AdminError('Passkey confirmation expired. Try again.', 403, true)
  }
  check()
  const credential = await usePasskey(options.options.publicKey)
  check()
  await consoleRequest('/v1/me/reauth/passkey', { ceremony_id: options.ceremony_id, credential })
  return await consoleRequest<StaffSession>('/v1/admin/session', {})
}

export const lookupAccount = (query: string, reason: string): Promise<Lookup> =>
  consoleRequest('/v1/admin/accounts/lookup', { query, reason })

export async function readAudit (source: 'console' | 'community', before: number | null, reason: string): Promise<AuditPage> {
  if (source === 'console') return await consoleRequest('/v1/admin/audit/read', { before, reason })
  // Local to this call only: never a URL, storage entry or refresh token.
  const proof = await consoleRequest<{ assertion: string; expires_at: number }>('/v1/me/staff/assertion', { audience: MODELS })
  if (proof.expires_at * 1000 <= Date.now()) throw new AdminError('Staff confirmation expired.', 401, true)
  return await send<AuditPage>(MODELS, '/v1/admin/audit/read', proof.assertion, { before, reason })
}

export interface StaffCommand { command: string; action: string; target: string; version: number; reason: string; details: Record<string, unknown> }
export interface CaseSummary { id: string; title: string; kind: string; state: string; version: number; assignee: string; at: number }
export interface CaseDetail extends CaseSummary { share_id: string; owner: string; hidden_by: string | null; action_due_at?: number | null; decision_due_at?: number | null; restore_after?: number | null; legal_hold?: boolean; resolved?: boolean; notices?: Array<{ id: number; reason: string; complete: boolean; decision: string | null }>; events: Array<{ id: number; actor: string; kind: string; text: string; at: number }> }
export interface Reservation { pattern: string; reason: string; managed: boolean; active: boolean; version: number; owner: string | null; expires_at: number | null }
export interface CommandResult { cases?: CaseSummary[]; case?: CaseDetail; reservations?: Reservation[]; account?: Partial<AdminAccount>; saved?: boolean }
export const newCommandId = (): string => crypto.randomUUID().replace(/-/g, '')
export function isStaffMutation (action: string): boolean { return !['queue', 'case', 'reservations'].includes(action) }

/** A fresh ceremony for every mutation. No write proof reaches this client and no mutation retries automatically. */
export async function staffCommand (command: StaffCommand, account = false, current: () => boolean = () => true): Promise<CommandResult> {
  if (isStaffMutation(command.action)) await confirmStaff()
  if (!current()) throw new AdminError('The page changed. No command was sent.', 0)
  try {
    return await consoleRequest<CommandResult>(account ? '/v1/admin/accounts/action' : '/v1/admin/community', command, false)
  } catch (error) {
    if (error instanceof AdminError && error.status === 409) throw new AdminError('This changed while you were reviewing it. Reload before deciding again.', 409)
    if (error instanceof AdminError && (error.status === 0 || error.status < 300 || error.status >= 500)) throw new AdminError('The outcome is uncertain. Reload the case and audit before deciding again.', error.status)
    throw error
  }
}
