import Vue from 'vue'
import { MutationTree } from 'vuex'
import { defaultState } from './'
import { HistoryItem, HistoryState } from './types'

export const mutations: MutationTree<HistoryState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  /**
   * Inits the console history from db
   */
  setInitHistory (state, payload: HistoryState) {
    if (payload) {
      // Quick hack because moonraker was returning an empty object for the
      // jobs array when there was no history.
      if (
        payload.count === 0
      ) payload.jobs = []
      Object.assign(state, payload)
    }
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

  setDeleteJob (state, payload: string[]) {
    if (payload) {
      payload.forEach((job_id) => {
        const i = state.jobs.findIndex(job => job.job_id === job_id)
        if (i >= 0) state.jobs.splice(i, 1)
      })
    }
  },

  setDeleteAllJobs (state) {
    Object.assign(state, defaultState())
  }
}
