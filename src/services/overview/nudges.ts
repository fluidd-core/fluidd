export const NUDGE_CAP = 0.1
const TOLERANCE = 1e-8

export interface NudgeContext { m1: boolean; layer: number; printing: boolean; ready: boolean; homed: boolean; waiting: boolean; identity: string }
export function firstLayerAllowed (value: NudgeContext): boolean {
  return value.m1 && Number.isInteger(value.layer) && value.layer >= 1 && value.layer <= 3 && value.printing && value.ready && value.homed && !value.waiting && !!value.identity
}

export interface NudgeBudget { total: number; remaining: number }

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

export function readBaseline (database: unknown, key: string): number | null | undefined {
  let value: unknown = database
  for (const part of key.split('.')) {
    if (!value || typeof value !== 'object' || !(part in value)) return undefined
    value = (value as Record<string, unknown>)[part]
  }
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function databasePart (value: string): string {
  return encodeURIComponent(value).replaceAll('.', '%2E')
}
