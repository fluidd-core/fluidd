import Vue from 'vue'
import { MutationTree } from 'vuex'
import { defaultState } from './'
import { NotificationsState, AppNotification } from './types'

export const mutations: MutationTree<NotificationsState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setPushNotification (state, n: AppNotification) {
    state.notifications.push(n)
  },

  setMergeNotification (state, options: { n: AppNotification; i: number }) {
    Vue.set(state.notifications, options.i, options.n)
  },

  setClearNotification (state, notification: AppNotification | string) {
    let i = -1
    if (typeof notification === 'string') {
      i = state.notifications.findIndex(n => n.title === notification)
    } else {
      i = state.notifications.findIndex(n => n === notification)
    }
    if (i >= 0) {
      state.notifications.splice(i, 1)
    }
  },

  setClearAllNotifications (state) {
    Vue.set(state, 'notifications', [...state.notifications.filter(n => !n.clear)])
  }
}
