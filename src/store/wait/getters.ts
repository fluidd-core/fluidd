import type { GetterTree } from 'vuex'
import type { WaitState } from './types'
import type { RootState } from '../types'

export const getters = {
  /**
   * Determine if we have a specific wait, or list of waits active or not.
   */
  hasWait: (state) => (wait: string | string[]): boolean => {
    if (Array.isArray(wait)) {
      return wait
        .some(val => state.waits.includes(val))
    } else {
      return state.waits.includes(wait)
    }
  },

  /**
   * Determine if we have any waits.
   */
  hasWaits: (state) => {
    return state.waits.length > 0
  },

  /**
   * Determine if we have any waits prefixed with...
   */
  hasWaitsBy: (state) => (prefix: string) => {
    return state.waits
      .some(wait => wait.startsWith(prefix))
  }
} satisfies GetterTree<WaitState, RootState>
