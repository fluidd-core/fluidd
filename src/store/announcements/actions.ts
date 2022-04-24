import { ActionTree } from 'vuex'
import { AnnouncementsState, Announcement } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'

export const actions: ActionTree<AnnouncementsState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Inits moonraker component
   */
  async init () {
    SocketActions.serverAnnouncementsList()
  },

  async onAnnouncementsList ({ commit }, payload) {
    if (payload) {
      commit('setAnnouncementsList', payload)
    }
  },

  async onAnnouncementDismissed ({ commit }, payload) {
    if (payload) {
      commit('setAnnouncementDismissed', { entry_id: payload.entry_id, dismissed: true })
    }
  },

  async onAnnouncementWake ({ commit }, payload) {
    if (payload) {
      commit('setAnnouncementDismissed', { entry_id: payload.entry_id, dismissed: false })
    }
  },

  dismiss (_, payload) {
    SocketActions.serverAnnouncementsDismiss(payload.entry_id)
  },

  dismissAll ({ state }) {
    const entries = [...state.entries]

    entries.forEach(async (entry: Announcement) => await SocketActions.serverAnnouncementsDismiss(entry.entry_id))
  }
}
