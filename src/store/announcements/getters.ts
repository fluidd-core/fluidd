import type { GetterTree } from 'vuex'
import type { RootState } from '../types'
import type { AnnouncementsState } from './types'

export const getters = {
  getAnnouncements: state => {
    return state.entries.filter(announcement => !announcement.dismissed)
  }
} satisfies GetterTree<AnnouncementsState, RootState>
