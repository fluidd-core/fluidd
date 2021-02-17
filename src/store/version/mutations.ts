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

  refreshing (state, payload) {
    state.refreshing = payload
  },

  onUpdateStatus (state, payload) {
    if ('busy' in payload) state.busy = payload.busy
    if ('github_limit_reset_time' in payload) state.github_limit_reset_time = payload.github_limit_reset_time
    if ('github_rate_limit' in payload) state.github_rate_limit = payload.github_rate_limit
    if ('github_requests_remaining' in payload) state.github_requests_remaining = payload.github_requests_remaining

    const versionInfo = payload.version_info || undefined
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
    } else {
      const id = state.responses.length
      state.responses.push({
        ...payload,
        id
      })
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
