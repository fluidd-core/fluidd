import { ActionTree } from 'vuex'
import { EventBus, FlashMessageTypes } from '@/eventBus'
import { v4 as uuidv4 } from 'uuid'
import { NotificationsState, AppPushNotification, AppNotification } from './types'
import { RootState } from '../types'

export const actions: ActionTree<NotificationsState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Adds a new notification.
   */
  async pushNotification ({ commit, state }, payload: AppPushNotification) {
    // When adding;
    // 1. Define if it should be merged with the same type if re-adding.
    // 2. Define if it should also provide a popover.
    // This needs two commits. One for a merge, one for not.
    // Then we can emit the toast if it was a merge or not.

    // Define the base notification.
    const n: AppNotification = {
      ...{
        // snackbar: true,
        id: uuidv4(),
        type: 'info',
        timestamp: new Date().getTime() / 1000,
        clear: true,
        merge: false
      },
      ...payload
    }

    // Sanity check...
    if (n.title && n.title !== '?' && n.id) {
      const i = state.notifications.findIndex(n => n.title === payload.title)
      if (n.merge && i >= 0) {
        commit('setMergeNotification', { n, i })
      } else {
        commit('setPushNotification', n)
      }

      if (payload.snackbar) {
        // Emit if snackbar is true.
        EventBus.$emit(n.title, { type: FlashMessageTypes.error })
      }
    }
  },

  /**
   * Clear a notification.
   */
  async clearNotification ({ commit, dispatch }, n: AppNotification | string) {
    if (typeof n === 'object' && n.type === 'announcement') {
      dispatch('announcements/dismiss', { entry_id: n.id }, { root: true })
      return
    }

    commit('setClearNotification', n)
  },

  /**
   * Clear all notifications.
   */
  async clearAll ({ commit, dispatch }) {
    commit('setClearAllNotifications')

    dispatch('announcements/dismissAll', {}, { root: true })
  }
}
