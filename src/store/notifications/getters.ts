import type { GetterTree } from 'vuex'
import type { AppNotification, NotificationsState } from './types'
import type { Announcement } from '../announcements/types'
import type { RootState } from '../types'

export const getters: GetterTree<NotificationsState, RootState> = {
  getNotifications: (state, getters) => {
    // Sort by datestamp, most recent first.
    let notifications = [...state.notifications].sort((a, b) => {
      return b.timestamp - a.timestamp
    })

    notifications = notifications.concat(getters.getAnnouncementsAsNotifications)

    // Easier to read.
    return [
      ...notifications.filter(n => n.type === 'error'),
      ...notifications.filter(n => n.type !== 'error')
    ]
  },

  getAnnouncementsAsNotifications: (state, getters, rootState, rootGetters) => {
    const announcements: Announcement[] = rootGetters['announcements/getAnnouncements']

    return announcements.map((a: Announcement): AppNotification => ({
      id: a.entry_id,
      type: 'announcement',
      to: a.url,
      title: a.title,
      description: a.description,
      timestamp: a.date,
      clear: true,
      merge: true
    }))
  }
}
