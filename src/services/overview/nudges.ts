export const NUDGE_CAP = 0.1
const TOLERANCE = 1e-8

export interface NudgeContext { m1: boolean; layer: number; printing: boolean; ready: boolean; homed: boolean; waiting: boolean; identity: string }
export function firstLayerAllowed (value: NudgeContext): boolean {
  return value.m1 && Number.isInteger(value.layer) && value.layer >= 1 && value.layer <= 3 && value.printing && value.ready && value.homed && !value.waiting && !!value.identity
}

export interface NudgeBudget { total: number; remaining: number }

export interface NudgeDatabaseTarget {
  printerId: string
  accountId: string
  route: string
  context: string
  databaseKey: string
}

const hundredths = (value: number) => Math.round(value * 100) / 100

export function nudgeBudget (reportedOffset: number, baseline: number): NudgeBudget | null {
  if (!Number.isFinite(reportedOffset) || !Number.isFinite(baseline)) return null
  const total = hundredths(reportedOffset - baseline)
  return { total, remaining: hundredths(Math.max(0, NUDGE_CAP - Math.abs(total))) }
}

export function nudgeFits (reportedOffset: number, baseline: number, step: number): boolean {
  return [-0.01, 0.01].includes(step) && Number.isFinite(reportedOffset) && Number.isFinite(baseline) &&
    Math.abs((reportedOffset + step) - baseline) <= NUDGE_CAP + TOLERANCE
}

export interface NudgeEntry {
  baseline: number
  start_time: number
  filename: string
  expected?: number
  pending?: { created: number; from: number; step?: number; device?: string; nonce?: string }
}

export function missingDatabaseKey (error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const response = (error as { response?: { status?: number; data?: { error?: { message?: unknown } } } }).response
  return response?.status === 404 && typeof response.data?.error?.message === 'string' && /database.*(?:key )?not found/i.test(response.data.error.message)
}

export function readNudgeEntry (value: unknown): NudgeEntry | null | undefined {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object') return null
  const entry = value as Partial<NudgeEntry>
  if (!Number.isFinite(entry.baseline) || !Number.isFinite(entry.start_time) || typeof entry.filename !== 'string') return null
  if (entry.expected !== undefined && !Number.isFinite(entry.expected)) return null
  if (entry.pending !== undefined && (!entry.pending || !Number.isFinite(entry.pending.created) || !Number.isFinite(entry.pending.from))) return null
  return entry as NudgeEntry
}

export function expectedCaughtUp (reported: number, expected: number, from: number, step?: number): boolean {
  if (![reported, expected, from].every(Number.isFinite)) return false
  const target = step === 0.01 || step === -0.01 ? from + step : expected
  return target >= from ? reported >= target - TOLERANCE : reported <= target + TOLERANCE
}

export function databasePart (value: string): string {
  return encodeURIComponent(value).split('.').join('%2E')
}
