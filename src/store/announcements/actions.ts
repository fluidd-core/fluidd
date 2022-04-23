import { ActionTree } from 'vuex'
import { AnnouncementsState } from './types'
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

  /**
   * Update the store with announcements
   */
  async onAnnouncementsList ({ commit }, payload) {
    if (payload) {
      commit('setAnnouncementsList', payload)
    }
  }
}
