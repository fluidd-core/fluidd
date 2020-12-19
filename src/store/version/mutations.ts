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
    if (versionInfo) {
      for (const k in versionInfo) {
        Vue.set(state.components, k, payload.version_info[k])
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
