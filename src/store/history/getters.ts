import { GetterTree } from 'vuex'
import { HistoryItem, HistoryState } from './types'
import { RootState } from '../types'
import { getFilePaths } from '../helpers'
import { AppFileWithMeta } from '../files/types'

export const getters: GetterTree<HistoryState, RootState> = {
  /**
   * Returns a list of history entries, sorted by their start dates and
   * optionally limited by a provided number.
   */
  getHistory: (state, getters, rootState, rootGetters) => (limit?: number) => {
    // const sdcard_file = rootState.printer?.printer.print_stats.filename || ''
    const root = 'gcodes'
    const jobs: HistoryItem[] = []
    const sorted = [...state.jobs]
      .sort((a, b) => { return b.start_time - a.start_time })

    // Bind the original file, and indicate that it still exists.
    for (const job of sorted) {
      const filePath = getFilePaths(job.filename, root)
      const file: AppFileWithMeta = rootGetters['files/getFile'](root, filePath.rootPath, filePath.filename)
      if (file !== undefined) {
        job.exists = true
        job.metadata.thumbnails = file.thumbnails
        jobs.push(job)
        if (
          limit !== undefined &&
          limit > 0 &&
          jobs.length >= limit
        ) {
          break
        }
      }
    }

    return jobs
  }
}
