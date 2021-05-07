import { GetterTree } from 'vuex'
import { NotificationsState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<NotificationsState, RootState> = {
  getNotifications: (state) => {
    // Sort by datestamp, most recent first.
    const sorted = [...state.notifications].sort((a, b) => {
      return b.timestamp - a.timestamp
    })

    // Easier to read.
    return [
      ...sorted.filter(n => n.type === 'error'),
      ...sorted.filter(n => n.type !== 'error')
    ]
  }
}
