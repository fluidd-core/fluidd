import Vue from 'vue'
import { MutationTree } from 'vuex'
import { defaultState } from './state'
import { HistoryItem, HistoryState } from './types'

export const mutations: MutationTree<HistoryState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  /**
   * Applies currently known history totals
   */
  setHistoryTotals (state, payload: HistoryState) {
    if (payload) Vue.set(state, 'job_totals', payload.job_totals)
  },

  /**
   * Applies history list
   */
  setHistoryList (state, payload: HistoryState) {
    if (payload.jobs !== undefined) Vue.set(state, 'jobs', payload.jobs)
    if (payload.count !== undefined) Vue.set(state, 'count', payload.count)
  },

  /**
   * Adds a history item.
   */
  setAddHistory (state, payload: HistoryItem) {
    if (payload) {
      state.jobs.push(payload)
      state.count++
    }
  },

  /**
   * Updates a history item.
   */
  setUpdateHistory (state, payload: HistoryItem) {
    if (payload) {
      const i = state.jobs.findIndex(job => job.job_id === payload.job_id)
      if (i >= 0) {
        Vue.set(state.jobs, i, payload)
      }
    }
  },

  setClearHistoryThumbnails (state, payload: string) {
    if (payload) {
      const i = state.jobs.findIndex(job => job.job_id === payload)
      if (i >= 0) {
        const job = state.jobs[i]
        Vue.set(state.jobs, i, {
          ...job,
          metadata: {
            ...job.metadata,
            thumbnails: []
          }
        })
      }
    }
  },

  setDeleteJob (state, payload: string[]) {
    if (payload) {
      payload.forEach((job_id) => {
        const i = state.jobs.findIndex(job => job.job_id === job_id)
        if (i >= 0) state.jobs.splice(i, 1)
      })
    }
  }
}
