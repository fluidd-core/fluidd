import type { ItemSetup } from './api'
import type { TargetRow } from './print-targets'

/** Prefer a genuinely ready, idle printer; otherwise require a deliberate choice. */
export function defaultPrintTarget (rows: TargetRow[]): TargetRow | null {
  return rows.find(row => row.fit.kind === 'ready' && row.action === 'print') ?? null
}

/** Warnings shown before bytes are sent. */
export function handoffWarnings (row: TargetRow | null, setup: ItemSetup | null): string[] {
  if (!row) return []
  const warnings: string[] = []
  if (row.tone === 'off') warnings.push(`${row.name} is offline.`)
  if (row.action === 'queue' || row.tone === 'run') warnings.push(`${row.name} is busy.`)
  if (setup && row.fit.kind !== 'ready' && row.fit.kind !== 'offline' && row.fit.kind !== 'unsliced') warnings.push(row.detail)
  return warnings
}
