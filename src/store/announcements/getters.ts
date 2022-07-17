import { GetterTree } from 'vuex'
import { AnnouncementsState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<AnnouncementsState, RootState> = {
  getAnnouncements: (state) => {
    return state.entries.filter(announcement => !announcement.dismissed)
  }
}
