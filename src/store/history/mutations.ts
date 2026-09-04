import Vue from 'vue'
import type { MutationTree } from 'vuex'
import { state as defaultState } from './state'
import type { HistoryState } from './types'

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
      } else {
        state.jobs.push(Object.freeze(payload))
      }

      state.unresolvedJobIds.delete(payload.job_id)
    }
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

  setDeleteJobs (state, payload: string[]) {
    if (payload) {
      for (const jobId of payload) {
        const i = state.jobs.findIndex(job => job.job_id === jobId)

        if (i >= 0) {
          state.jobs.splice(i, 1)
        }

        state.unresolvedJobIds.add(jobId)
      }
    }
  },

  setAddUnresolvedJobIds (state, payload: string[]) {
    for (const jobId of payload) {
      state.unresolvedJobIds.add(jobId)
    }
  },

  setRemoveUnresolvedJobIds (state, payload: string[]) {
    for (const jobId of payload) {
      state.unresolvedJobIds.delete(jobId)
    }
  },

  setClearUnresolvedJobIds (state) {
    state.unresolvedJobIds.clear()
  },

  setAllLoaded (state, payload: boolean) {
    state.allLoaded = payload
  }
} satisfies MutationTree<HistoryState>
