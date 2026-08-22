import Vue from 'vue'
import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { HistoryState } from './types'

/**
 * Drops both cache entries for a job id, positive and negative, because
 * `state.jobs` now answers for it.
 */
const forgetCachedJob = (state: HistoryState, jobId: string) => {
  Vue.delete(state.jobsById, jobId)
  Vue.delete(state.missingJobIds, jobId)
}

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  /**
   * Applies currently known history totals
   */
  setHistoryTotals (state, payload: Moonraker.History.TotalsResponse) {
    state.job_totals = payload.job_totals
  },

  /**
   * Applies history list
   */
  setHistoryList (state, payload: Moonraker.History.ListResponse) {
    if (payload.jobs != null) {
      state.jobs = payload.jobs
        .map(job => Object.freeze(job))

      // Anything the new page covers is served from `jobs`, so drop it from
      // the cache - including any negative entry, which the page just proved
      // wrong.
      for (const job of state.jobs) {
        forgetCachedJob(state, job.job_id)
      }
    }
    if (payload.count != null) {
      state.count = payload.count
    }
  },

  /**
   * Adds a history item.
   */
  setAddHistory (state, payload: Moonraker.History.Job) {
    if (payload) {
      state.jobs.push(Object.freeze(payload))
      state.count++

      // Moonraker's job ids are a SQLite `INTEGER PRIMARY KEY` with no
      // AUTOINCREMENT, so an id is reused once the newest job is deleted. A
      // negative entry for it is now stale.
      forgetCachedJob(state, payload.job_id)
    }
  },

  /**
   * Updates a history item.
   */
  setUpdateHistory (state, payload: Moonraker.History.Job) {
    if (payload) {
      const i = state.jobs.findIndex(job => job.job_id === payload.job_id)
      if (i >= 0) {
        Vue.set(state.jobs, i, Object.freeze(payload))
      }

      forgetCachedJob(state, payload.job_id)
    }
  },

  /**
   * Applies jobs fetched individually for files whose job is outside the
   * loaded page. Committed once per drain rather than once per response, so
   * a directory's worth of results is a single re-render.
   */
  setJobsById (state, payload: Moonraker.History.Job[]) {
    for (const job of payload) {
      Vue.set(state.jobsById, job.job_id, Object.freeze(job))
      Vue.delete(state.missingJobIds, job.job_id)
    }
  },

  /**
   * Records job ids Moonraker has no row for, so they are not re-requested.
   */
  setMissingJobIds (state, payload: string[]) {
    for (const jobId of payload) {
      Vue.set(state.missingJobIds, jobId, true)
      Vue.delete(state.jobsById, jobId)
    }
  },

  /**
   * Drops every negative cache entry. A 404 recorded against a previous
   * connection is not evidence about this one.
   */
  setClearMissingJobIds (state) {
    state.missingJobIds = {}
  },

  setClearHistoryThumbnails (state, payload: string) {
    if (payload) {
      const i = state.jobs.findIndex(job => job.job_id === payload)
      if (i >= 0) {
        const job = state.jobs[i]
        Vue.set(state.jobs, i, Object.freeze({
          ...job,
          metadata: {
            ...job.metadata,
            thumbnails: []
          }
        }))
      }
    }
  },

  setDeleteJob (state, payload: string[]) {
    if (payload) {
      payload.forEach((job_id) => {
        const i = state.jobs.findIndex(job => job.job_id === job_id)
        if (i >= 0) state.jobs.splice(i, 1)

        // Without this the file browser keeps rendering a deleted job, and
        // re-fetching the id would only 404.
        Vue.delete(state.jobsById, job_id)
        Vue.set(state.missingJobIds, job_id, true)
      })
    }
  }
} satisfies MutationTree<HistoryState>
