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
    const rollup: any = {
      print_duration: 0,
      total_duration: 0,
      filament_used: 0,
      print_duration_avg: 0,
      total_duration_avg: 0,
      filament_used_avg: 0,
      total_jobs: 0
    }
    if (state.jobs && state.jobs.length) {
      const d: any = state.jobs.reduce((prevJob, job) => {
        return {
          ...job,
          print_duration: job.print_duration + prevJob.print_duration,
          total_duration: job.total_duration + prevJob.total_duration,
          filament_used: job.filament_used + prevJob.filament_used,
          longest_duration: (job.total_duration > prevJob.total_duration)
            ? job.total_duration
            : prevJob.total_duration
        }
      })
      return {
        ...rollup,
        ...d,
        print_duration_avg: d.print_duration / state.jobs.length,
        total_duration_avg: d.total_duration / state.jobs.length,
        filament_used_avg: d.filament_used / state.jobs.length,
        total_jobs: state.jobs.length
      }
    }
    return rollup
  }
}
