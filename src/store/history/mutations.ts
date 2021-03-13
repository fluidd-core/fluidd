import { MutationTree } from 'vuex'
import { defaultState } from './'
import { HistoryState } from './types'

export const mutations: MutationTree<HistoryState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },
  /**
   * Inits the console history from db
   */
  setInitHistory (state, payload: HistoryState) {
    if (payload) Object.assign(state, payload)
  }
}
