import Vue from 'vue'
import type { GetterTree } from 'vuex'
import type { HistoryItem, HistoryState } from './types'
import type { RootState } from '../types'

export const getters = {
  /**
   * Returns all history, sorted by start time.
   */
  getHistory: (state) => {
    return state.jobs
      .map((job): HistoryItem => {
        const { metadata, ...restOfJob } = job

        const item: HistoryItem = restOfJob

        if (metadata != null) {
          const { filament_name, filament_type, ...restOfMetadata } = metadata

          item.metadata = {
            ...restOfMetadata,
            modified: Vue.$filters.moonrakerDateAsUnixTime(metadata.modified)
          }

          if (filament_name != null) {
            item.metadata.filament_name = Vue.$filters.getStringArray(filament_name)
          }

          if (filament_type != null) {
            item.metadata.filament_type = Vue.$filters.getStringArray(filament_type)
          }
        }

        return item
      })
      .sort((a, b) => b.start_time - a.start_time)
  },

  /**
   * Return a history item given a job id.
   */
  getHistoryById: (state, getters) => (jobId: string) => {
    const history: HistoryItem[] = getters.getHistory

    return history
      .find(job => job.job_id === jobId)
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
