import { GetterTree } from 'vuex'
import { HistoryItem, HistoryState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<HistoryState, RootState> = {
  /**
   * Returns all history, sorted by start time.
   */
  getHistory: (state) => {
    return (state.jobs && state.jobs.length)
      ? [...state.jobs].sort((a, b) => { return b.start_time - a.start_time })
      : []
  },

  /**
   * Return a history item given a job id.
   */
  getHistoryById: (state) => (jobId: string) => {
    return state.jobs.find(job => job.job_id === jobId)
  },

  /**
   * Returns a list of history entries, sorted by their start dates and
   * optionally limited by a provided number.
   */
  getUniqueHistory: (state, getters) => (limit = 3) => {
    const jobs: HistoryItem[] = []
    const history = getters.getHistory

    // Go through each item and;
    // - Only show items that still exist
    // - Don't allow dupes
    // - Respect the limit
    for (const job of history) {
      if (
        job.exists
      ) {
        const dupe = jobs.some((j) => job.filename === j.filename)
        if (!dupe) {
          jobs.push(job)
        }
        if (jobs.length === limit) break
      }
    }
    return jobs
  },

  /**
   * Provide a rollup of data for stat purposes.
   */
  getRollUp: (state) => {
    const totals = state.job_totals
    return {
      ...totals,
      filament_avg: (totals.total_filament_used) ? totals.total_filament_used / totals.total_jobs : 0,
      print_avg: (totals.total_print_time) ? totals.total_print_time / totals.total_jobs : 0,
      total_avg: (totals.total_time) ? totals.total_time / totals.total_jobs : 0
    }
  }
}
