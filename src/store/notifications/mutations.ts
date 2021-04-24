import { MutationTree } from 'vuex'
import { defaultState } from './'
import { NotificationsState } from './types'

export const mutations: MutationTree<NotificationsState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  }
}
