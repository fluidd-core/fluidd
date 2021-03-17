import { GetterTree } from 'vuex'
import { HistoryItem, HistoryState } from './types'
import { RootState } from '../types'
import { getFilePaths } from '../helpers'
import consola from 'consola'

export const getters: GetterTree<HistoryState, RootState> = {
  /**
   * Returns all history, sorted by start time.
   */
  getHistory: (state) => {
    return [...state.jobs]
      .sort((a, b) => { return b.start_time - a.start_time })
  },

  /**
   * Returns a list of history entries, sorted by their start dates and
   * optionally limited by a provided number.
   */
  getUniqueHistory: (state, getters) => (limit = 3) => {
    // const sdcard_file = rootState.printer?.printer.print_stats.filename || ''
    const root = 'gcodes'
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
          const filePath = getFilePaths(job.filename, root)
          jobs.push({
            ...job,
            name: filePath.filename,
            path: filePath.path
          })
        }
        if (jobs.length === limit) break
      }
    }
    return jobs
  }
}
