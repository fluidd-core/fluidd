import { MutationTree } from 'vuex'
import { WaitState } from './types'
import { defaultState } from './index'

export const mutations: MutationTree<WaitState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  /**
   * Add a wait, ensuring we don't add dupes.
   */
  setAddWait (state, payload) {
    const i = state.waits.findIndex(wait => wait === payload)
    if (i === -1) state.waits.push(payload)
  },

  /**
   * Remove a wait, if found.
   */
  setRemoveWait (state, payload) {
    if (state.waits.length) {
      state.waits.splice(state.waits.indexOf(payload, 0), 1)
    }
  }
}
