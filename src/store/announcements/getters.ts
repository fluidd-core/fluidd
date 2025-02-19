import type { GetterTree } from 'vuex'
import type { AnnouncementsState } from './types'
import type { RootState } from '../types'

export const getters: GetterTree<AnnouncementsState, RootState> = {
  getAnnouncements: (state) => {
    return state.entries
      .filter(announcement => !announcement.dismissed)
  }
}
