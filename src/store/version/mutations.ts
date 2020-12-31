import Vue from 'vue'
import { MutationTree } from 'vuex'
import { VersionState } from './types'
import { defaultState } from './index'

export const mutations: MutationTree<VersionState> = {
  resetState (state) {
    const newState = defaultState()
    Object.keys(newState).forEach((key: string) => {
      Vue.set(state, key, newState[key])
    })
  },

  onUpdateStatus (state, payload) {
    const versionInfo = payload.version_info || undefined
    state.busy = payload.busy || false
    state.github_limit_reset_time = payload.github_limit_reset_time || 0
    state.github_rate_limit = payload.github_rate_limit || 0
    state.github_requests_remaining = payload.github_requests_remaining || 0

    if (versionInfo) {
      for (const k in versionInfo) {
        const type = k
        Vue.set(state.components, k, { type, ...payload.version_info[k] })
      }
    }
  },

  onUpdateResponse (state, payload) {
    // If we get a complete === true, then assume the update is complete
    // and set busy to false also.
    if (payload.complete) {
      state.busy = false
      // state.responses = []
    } else {
      state.responses.unshift(payload)
    }
  },

  clearUpdateResponse (state) {
    state.responses = []
  },

  setVersion (state, payload) {
    state.fluidd.version = payload
  },
  setHash (state, payload) {
    state.fluidd.hash = payload
  },
  setSkipClientUpdates (state, payload) {
    if (payload && 'skipClientUpdates' in payload) {
      state.skipClientUpdates = payload.skipClientUpdates
    }
  }
}
