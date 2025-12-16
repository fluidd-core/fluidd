import type { MutationTree } from 'vuex'
import type { VersionState } from './types'
import { defaultState } from './state'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setUpdateStatus (state, payload: Partial<Moonraker.UpdateManager.StatusResponse>) {
    state.status = {
      ...state.status,
      ...payload
    }
  },

  setUpdateResponse (state, payload) {
    // If we get a complete === true, then assume the update is complete
    // and set busy to false also.
    if (payload.complete) {
      if (state.status?.busy === true) {
        state.status.busy = false
      }
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
} satisfies MutationTree<VersionState>
