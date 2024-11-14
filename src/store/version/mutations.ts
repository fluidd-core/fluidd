import Vue from 'vue'
import type { MutationTree } from 'vuex'
import type { VersionState } from './types'
import { defaultState } from './state'

export const mutations: MutationTree<VersionState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setUpdateStatus (state, payload) {
    if (payload) {
      if ('busy' in payload) state.busy = payload.busy
      if ('github_limit_reset_time' in payload) state.github_limit_reset_time = payload.github_limit_reset_time
      if ('github_rate_limit' in payload) state.github_rate_limit = payload.github_rate_limit
      if ('github_requests_remaining' in payload) state.github_requests_remaining = payload.github_requests_remaining

      const o = Object.assign(
        {},
        state.version_info,
        payload.version_info
      )
      Vue.set(state, 'version_info', o)
    }
  },

  setUpdateResponse (state, payload) {
    // If we get a complete === true, then assume the update is complete
    // and set busy to false also.
    if (payload.complete) {
      state.busy = false
    } else {
      const id = state.responses.length
      state.responses.push({
        ...payload,
        id
      })
    }
  },

  setClearUpdateResponse (state) {
    state.responses = []
  }
}
