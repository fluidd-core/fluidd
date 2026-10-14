import type { HistoryItem } from '@/store/history/types'

type Job = Pick<HistoryItem, 'start_time' | 'status' | 'filament_used'>

/**
 * Whether a print Fluidd starts asks the plate check first: the printer's
 * newest job put material on the plate, as the slicer's print check decides
 * (printer-client's bridge host, `deposited`). Fluidd's own copy of the
 * history can be empty because it hasn't loaded, not because there was
 * nothing, so an empty or unknown history asks too.
 */
export function plateCheckNeeded (jobs: Job[] | null | undefined): boolean {
  if (!jobs?.length) return true
  const newest = jobs.reduce((a, b) => (b.start_time > a.start_time ? b : a))
  return newest.status !== 'in_progress' && (newest.filament_used ?? 0) > 0
}
