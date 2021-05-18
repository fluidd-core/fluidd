import { GetterTree } from 'vuex'
import { WaitState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<WaitState, RootState> = {
  /**
   * Determine if we have a specific wait, or list of waits active or not.
   */
  hasWait: (state) => (wait: string | string[]): boolean => {
    if (Array.isArray(wait) && wait.length) {
      let waits = wait as string[]
      waits = waits.filter(val => state.waits.includes(val))
      return (waits.length > 0)
    } else {
      wait = wait as string
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
    const waits = state.waits.filter(wait => wait.startsWith(prefix))
    return waits.length > 0
  }
}
