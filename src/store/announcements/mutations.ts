import Vue from 'vue'
import { MutationTree } from 'vuex'
import { defaultState } from '.'
import { AnnouncementsState } from './types'

export const mutations: MutationTree<AnnouncementsState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  /**
   * Applies announcements list
   */
  setAnnouncementsList (state, payload: AnnouncementsState) {
    if (payload.entries !== undefined) Vue.set(state, 'entries', payload.entries)
    if (payload.feeds !== undefined) Vue.set(state, 'feeds', payload.feeds)
  }
}
