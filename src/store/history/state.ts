import type { HistoryState } from './types'

export const state = (): HistoryState => {
  return {
    jobs: [],
    unresolvedJobIds: new Set(),
    allLoaded: false,
    job_totals: {
      total_jobs: 0,
      total_time: 0,
      total_print_time: 0,
      total_filament_used: 0,
      longest_job: 0,
      longest_print: 0
    }
  }
}
