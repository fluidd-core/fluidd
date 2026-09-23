import type { MutationTree } from 'vuex'
import type { WaitState } from './types'
import { createState } from './state'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, createState())
  },

  /**
   * Add a wait, ensuring we don't add dupes.
   */
  setAddWait (state, payload: string) {
    const i = state.waits.indexOf(payload)
    if (i === -1) state.waits.push(payload)
  },

  /**
   * Remove a wait, if found.
   */
  setRemoveWait (state, payload: string) {
    const i = state.waits.indexOf(payload)
    if (i !== -1) state.waits.splice(i, 1)
  }
} satisfies MutationTree<WaitState>
