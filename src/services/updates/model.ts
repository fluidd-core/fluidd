/**
 * The printer's own software update (MuonOS's over-the-air update), as
 * Fluidd shows it: in Settings › Updates, on the Updating page, and while
 * the printer restarts into it and can't answer.
 *
 * The Aux API's /update/status says where an install stands. Its `session`
 * (MuonOS feat/updating-signal, KAN-512) follows one install from the press
 * to its outcome, across the reboot: preparing, installing, rebooting,
 * verifying, then updated, rolled_back or failed. Fluidd keeps the last
 * active session it saw (remember), so when the printer goes quiet in
 * `installing` or `rebooting` it says "updating", not "can't reach", for as
 * long as the printer said a restart may take (offline_budget_seconds).
 *
 * A printer whose image predates `session` reports none; then the versions
 * tell: running the version it was going to means updated, still the old
 * one means it didn't take.
 */

export type SessionPhase = 'idle' | 'preparing' | 'installing' | 'rebooting' | 'verifying' | 'updated' | 'rolled_back' | 'failed'

export const ACTIVE_PHASES: SessionPhase[] = ['preparing', 'installing', 'rebooting', 'verifying']

export interface UpdateSession {
  job_id?: string | null;
  phase?: SessionPhase;
  from_version?: string | null;
  to_version?: string | null;
  started_at?: string | null;
  reboot_at?: string | null;
  offline_budget_seconds?: number | null;
  finished_at?: string | null;
  error?: { kind?: string, message?: string } | null;
}

/** The parts of /server/aux/update/status Fluidd reads. */
export interface AuxUpdateStatus {
  state?: string;
  current_version?: string | null;
  target_version?: string | null;
  update_available?: boolean;
  requires_commit?: boolean;
  progress?: number | null;
  last_checked?: string | null;
  error?: string | null;
  release_notes?: string | null;
  install?: { phase?: string, job_id?: string | null, progress?: number | null } | null;
  session?: UpdateSession | null;
}

/** What Fluidd remembers of an install, per printer, so it can say "updating" while the printer can't answer. */
export interface Remembered {
  jobId: string | null;
  phase: SessionPhase;
  from: string | null;
  to: string | null;
  progress: number | null;
  /** When Fluidd last heard this, ms. */
  seenAt: number;
  /** When the printer went quiet during it, ms. */
  lostAt: number | null;
  budgetMs: number;
}

/** When the printer doesn't say how long a restart may take: 20 minutes (one slow boot took 15). */
export const DEFAULT_BUDGET_MS = 20 * 60 * 1000

/** "20261006141553-d0044d8" → the build's date and its commit; anything else as it is. */
export function versionLabel (version: string | null | undefined): { text: string, date: Date | null, commit: string } {
  const v = (version ?? '').trim()
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})-([0-9a-f]{6,40})$/i.exec(v)
  if (!m) return { text: v || 'unknown', date: null, commit: '' }
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]))
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return { text: `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()} · ${m[7].slice(0, 7)}`, date, commit: m[7].slice(0, 7) }
}

/** The session, or one made from the older fields when the printer predates it. */
export function sessionOf (status: AuxUpdateStatus | null): UpdateSession | null {
  if (!status) return null
  if (status.session && status.session.phase) return status.session
  const state = status.state ?? ''
  if (state === 'installing') return { phase: 'installing', from_version: status.current_version, to_version: status.target_version, job_id: status.install?.job_id }
  if (state === 'rebooting') return { phase: 'rebooting', from_version: status.current_version, to_version: status.target_version, job_id: status.install?.job_id }
  if (status.requires_commit || state === 'commit_pending' || state === 'committing') return { phase: 'verifying', to_version: status.current_version }
  return null
}

/** What to keep after hearing the printer: the active session (with progress), or nothing once it has ended. */
export function remember (prev: Remembered | null, status: AuxUpdateStatus | null, now: number): Remembered | null {
  const s = sessionOf(status)
  if (!s || !s.phase) return prev
  if (!ACTIVE_PHASES.includes(s.phase)) {
    // The outcome of what we remembered: keep it until it has been shown (see outcome()).
    return prev && prev.jobId && s.job_id && prev.jobId !== s.job_id ? prev : prev ? { ...prev, phase: s.phase, seenAt: now, lostAt: null } : null
  }
  return {
    jobId: s.job_id ?? prev?.jobId ?? null,
    phase: s.phase,
    from: s.from_version ?? prev?.from ?? null,
    to: s.to_version ?? prev?.to ?? null,
    progress: typeof status?.progress === 'number' ? status.progress : (s.phase === prev?.phase ? prev?.progress ?? null : null),
    seenAt: now,
    lostAt: null,
    budgetMs: s.offline_budget_seconds ? s.offline_budget_seconds * 1000 : prev?.budgetMs ?? DEFAULT_BUDGET_MS
  }
}

/** The printer went quiet: when, if an install was under way. */
export function lost (prev: Remembered | null, now: number): Remembered | null {
  if (!prev || !ACTIVE_PHASES.includes(prev.phase) || prev.lostAt) return prev
  return { ...prev, lostAt: now }
}

/** While the printer can't be reached: the Updating screen, its late version, or nothing (the usual "can't reach"). */
export function offlineScreen (r: Remembered | null, now: number): 'updating' | 'updating-late' | null {
  if (!r || !['preparing', 'installing', 'rebooting', 'verifying'].includes(r.phase)) return null
  const since = r.lostAt ?? r.seenAt
  return now - since <= r.budgetMs ? 'updating' : 'updating-late'
}

/** How an install that Fluidd followed ended, once the printer is back; null while it is still going. */
export function outcome (r: Remembered | null, status: AuxUpdateStatus | null): 'updated' | 'rolled_back' | 'failed' | null {
  if (!r || !status) return null
  const s = status.session
  if (s && s.job_id && r.jobId && s.job_id === r.jobId && s.phase && ['updated', 'rolled_back', 'failed'].includes(s.phase)) {
    return s.phase as 'updated' | 'rolled_back' | 'failed'
  }
  if (s && s.phase && ACTIVE_PHASES.includes(s.phase)) return null
  // No session for this job (an image that predates it): the versions tell.
  if (status.requires_commit) return null
  if (r.to && status.current_version === r.to) return 'updated'
  if (r.phase === 'rebooting' || r.phase === 'verifying') return r.from && status.current_version === r.from ? 'rolled_back' : null
  return null
}

export interface UpdateStep {
  id: 'install' | 'restart' | 'check' | 'done';
  label: string;
  state: 'done' | 'now' | 'next';
}

/** The four steps the Updating page shows, and which it is on. */
export function updateSteps (phase: SessionPhase | 'offline' | 'late'): UpdateStep[] {
  const order: UpdateStep['id'][] = ['install', 'restart', 'check', 'done']
  const at: Record<string, number> = {
    preparing: 0, installing: 0, rebooting: 1, offline: 1, late: 1, verifying: 2, updated: 4, rolled_back: 4, failed: 4, idle: 0
  }
  const now = at[phase] ?? 0
  const labels: Record<UpdateStep['id'], string> = {
    install: 'Writing the new version',
    restart: 'Restarting into it',
    check: 'Checking it works',
    done: 'Done'
  }
  return order.map((id, i) => ({ id, label: labels[id], state: i < now ? 'done' : i === now ? 'now' : 'next' }))
}

/** What the page says for where the update stands. */
export function updateHeadline (phase: SessionPhase | 'offline' | 'late', progress: number | null, to: string | null): { title: string, text: string } {
  const version = to ? versionLabel(to).text : 'the new version'
  switch (phase) {
    case 'preparing':
      return { title: 'Getting the update ready', text: `Checking ${version} before it is written.` }
    case 'installing':
      return progress !== null && progress >= 100
        ? { title: 'Finishing up', text: 'The new version is written. The printer checks it, then restarts.' }
        : { title: 'Updating', text: `Writing ${version}${progress !== null ? `: ${Math.round(progress)}%` : ''}. The printer keeps working meanwhile; it restarts at the end.` }
    case 'rebooting':
    case 'offline':
      return { title: 'Restarting to finish the update', text: 'The printer is starting its new version. This page reconnects by itself. Don\'t turn the printer off.' }
    case 'late':
      return {
        title: 'This is taking longer than expected',
        text: 'If the printer\'s screen is dark or hasn\'t changed for a while, turn it off and on again. It will start on the version it had before, and you can try again.'
      }
    case 'verifying':
      return { title: 'Checking the update', text: `${version} is running. The printer checks everything works before it keeps it; a restart now would undo it.` }
    case 'updated':
      return { title: 'Updated', text: `The printer is on ${version}.` }
    case 'rolled_back':
      return { title: 'The update didn\'t complete', text: 'The printer went back to the version it had, so nothing changed. You can try again.' }
    case 'failed':
      return { title: 'The update didn\'t install', text: 'Nothing changed on the printer. You can try again.' }
    default:
      return { title: 'Up to date', text: '' }
  }
}
