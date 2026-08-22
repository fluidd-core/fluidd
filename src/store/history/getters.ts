import type { GetterTree } from 'vuex'
import type { HistoryItem, HistoryState } from './types'
import type { RootState } from '../types'
import toHistoryItem from './to-history-item'

export const getters = {
  /**
   * Returns all history, sorted by start time.
   *
   * Only the loaded page - jobs resolved individually for the file browser are
   * deliberately absent, so this stays a contiguous page of the history.
   */
  getHistory: (state) => {
    return state.jobs
      .map(toHistoryItem)
      .sort((a, b) => b.start_time - a.start_time)
  },

  /**
   * An index of every job we can resolve, by id.
   *
   * A derived getter rather than state: `getHistoryById` is called once per
   * file by `files/getDirectory`, and a `.find()` there makes that render
   * O(files x jobs). Deriving it also keeps the Map out of state, which Vue 2
   * cannot make reactive.
   */
  getHistoryByIdMap: (state, getters): Map<string, HistoryItem> => {
    const map = new Map<string, HistoryItem>()

    for (const [jobId, job] of Object.entries(state.jobsById)) {
      if (job != null) {
        map.set(jobId, toHistoryItem(job))
      }
    }

    // The loaded page wins over the cache - it is the fresher copy.
    for (const item of getters.getHistory as HistoryItem[]) {
      map.set(item.job_id, item)
    }

    return map
  },

  /**
   * Return a history item given a job id.
   */
  getHistoryById: (state, getters) => (jobId: string): HistoryItem | undefined => {
    const map: Map<string, HistoryItem> = getters.getHistoryByIdMap

    return map.get(jobId)
  },

  /**
   * Return a history item given a filename. Only return
   * items that have a status of completed, and that still
   * exist.
   */
  getHistoryByFilename: (state, getters) => (filename: string) => {
    const history: HistoryItem[] = getters.getHistory

    return history.find(job => (
      job.filename === filename &&
      job.status === 'completed' &&
      job.exists === true
    ))
  },

  /**
   * Returns a list of history entries, sorted by their start dates and
   * optionally limited by a provided number.
   */
  getUniqueHistory: (state, getters) => (limit = 3) => {
    const jobs: HistoryItem[] = []
    const history: HistoryItem[] = getters.getHistory

    // Go through each item and;
    // - Only show items that still exist
    // - Don't allow dupes
    // - Respect the limit
    for (const job of history) {
      if (job.exists) {
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
} satisfies GetterTree<HistoryState, RootState>
