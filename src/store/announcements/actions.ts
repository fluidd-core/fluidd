import type { ActionTree } from 'vuex'
import type { AnnouncementsState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'

export const actions = {
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

  async onAnnouncementsList ({ commit }, payload: Moonraker.Announcements.ListResponse) {
    if (payload) {
      commit('setAnnouncementsList', payload)
    }
  },

  async onAnnouncementUpdate ({ commit }, payload: Moonraker.Announcements.ListResponse) {
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

  async dismiss (_, payload) {
    SocketActions.serverAnnouncementsDismiss(payload.entry_id, payload.wake_time)
  },

  async dismissAll ({ state }) {
    const entries = [...state.entries]

    entries.forEach(async (entry) => await SocketActions.serverAnnouncementsDismiss(entry.entry_id))
  }
} satisfies ActionTree<AnnouncementsState, RootState>
