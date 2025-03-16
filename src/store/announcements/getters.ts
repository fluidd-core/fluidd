import type { GetterTree } from 'vuex'
import type { AnnouncementsState } from './types'
import type { RootState } from '../types'

export const getters = {
  getAnnouncements: (state) => {
    return state.entries
      .filter(announcement => !announcement.dismissed)
  }
} satisfies GetterTree<AnnouncementsState, RootState>
