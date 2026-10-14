/**
 * How long the account's things are kept, as the Privacy page says it: the
 * console's statement (`GET /v1/retention`) in words. Its own module, so the
 * header's account menu, which reads model.ts, doesn't carry it.
 */
export interface RetentionRow {
  key: string;
  label: string;
  value: string;
}

/** The console's retention statement's keys, as the Privacy page names them, in its order. */
const RETENTION_LABELS: Array<[string, string, (v: unknown) => string]> = [
  ['account', 'Your account, name and email', v => sentenceCase(String(v))],
  ['sessions', 'A signed-in device', v => sentenceCase(String(v))],
  ['security_events_days', 'Security activity', v => `${v} days`],
  ['grants', 'A pass that lets a device reach a printer', v => sentenceCase(String(v))],
  ['printers', 'A printer linked to your account', v => sentenceCase(String(v))],
  ['shares', 'Access you give someone', v => sentenceCase(String(v))],
  ['invites', 'An invite to use a printer', v => sentenceCase(String(v))],
  ['invite_links', 'An invite link', v => sentenceCase(String(v))],
  ['join_requests', 'A request to use a printer', v => sentenceCase(String(v))],
  ['email_tokens', 'A link we email you', v => sentenceCase(String(v))],
  ['push_tokens', "A phone's alert address", v => sentenceCase(String(v))],
  ['alert_subscriptions', "A phone's alerts for a printer", v => sentenceCase(String(v))],
  ['live_activity_tokens_hours', 'Lock-screen progress on an iPhone', v => `${v} hours`],
  ['alert_metadata', 'Each alert', v => sentenceCase(String(v))],
  ['deletion_notices', 'Telling our other services an account has gone', v => sentenceCase(String(v))],
  ['backups_days', 'Backups', v => `${v} days`]
]

function sentenceCase (text: string): string {
  const t = text.trim()
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t
}

/**
 * The console's retention statement (`GET /v1/retention`, the numbers its
 * deletion job uses) as rows: the known keys in words, in order, then any
 * the console added since, as it says them. How often the job runs isn't a
 * row.
 */
export function retentionRows (statement: Record<string, unknown>): RetentionRow[] {
  const rows: RetentionRow[] = []
  for (const [key, label, value] of RETENTION_LABELS) {
    if (statement[key] !== undefined && statement[key] !== null) rows.push({ key, label, value: value(statement[key]) })
  }
  for (const [key, raw] of Object.entries(statement)) {
    if (key === 'job_runs_every_seconds' || RETENTION_LABELS.some(([known]) => known === key) || raw === null || typeof raw === 'object') continue
    rows.push({ key, label: sentenceCase(key.replace(/_/g, ' ')), value: sentenceCase(String(raw)) })
  }
  return rows
}

/** The Library's windows (the model service's, MSV-5), beside the console's. */
export const LIBRARY_RETENTION: RetentionRow[] = [
  { key: 'library_files', label: 'Library files', value: 'Until you delete them; 30 days after you turn the Library off' }
]
