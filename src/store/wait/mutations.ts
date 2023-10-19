import type { MutationTree } from 'vuex'
import type { WaitState } from './types'
import { defaultState } from './state'

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
    const i = state.waits.indexOf(payload)
    if (i === -1) state.waits.push(payload)
  },

  /**
   * Remove a wait, if found.
   */
  setRemoveWait (state, payload) {
    const i = state.waits.indexOf(payload)
    if (i !== -1) state.waits.splice(i, 1)
  }
}
