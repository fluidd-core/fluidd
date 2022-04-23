import { GetterTree } from 'vuex'
import { AnnouncementsState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<AnnouncementsState, RootState> = {
  /**
   * Returns all annoucements, sorted by start time.
   */
  getAnnouncements: (state) => {
    return state.entries ?? []
  }
}
