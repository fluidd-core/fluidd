import Vue from 'vue'
import { MutationTree } from 'vuex'
import { defaultState } from './state'
import { AnnouncementsState } from './types'

export const mutations: MutationTree<AnnouncementsState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setAnnouncementsList (state, payload: AnnouncementsState) {
    if (payload.entries) Vue.set(state, 'entries', payload.entries)
    if (payload.feeds) Vue.set(state, 'feeds', payload.feeds)
  },

  setAnnouncementDismissed (state, payload: { entry_id: string, dismissed: boolean }) {
    const entries = [...state.entries]

    const entry = entries.find(entry => entry.entry_id === payload.entry_id)
    if (entry) {
      entry.dismissed = payload.dismissed

      if (!payload.dismissed) {
        entry.date_dismissed = null
        entry.dismiss_wake = null
      } else {
        entry.date_dismissed = Date.now()
      }
    }

    Vue.set(state, 'entries', entries)
  }
}
