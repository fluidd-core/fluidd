import type { ActionTree } from 'vuex'
import type { TimelapseState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { consola } from 'consola'
import { EventBus } from '@/eventBus'
import i18n from '@/plugins/i18n'

export const actions = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Make a socket request to init the timelapse component.
   */
  async init () {
    SocketActions.machineTimelapseGetSettings()
    SocketActions.machineTimelapseLastFrameInfo()
  },

  async onSettings ({ commit }, payload: Moonraker.Timelapse.SettingsResponse) {
    commit('setSettings', payload)
  },

  async onLastFrame ({ commit }, payload: Moonraker.Timelapse.LastFrameInfoResponse) {
    commit('setLastFrame', payload)
  },

  async onEvent ({ commit }, payload) {
    switch (payload.action) {
      case 'newframe': {
        if (payload.status === 'error') {
          // open snackbar
          EventBus.$emit(i18n.tc('app.timelapse.error.newframe'), { type: 'error' })
        } else {
          const count = parseInt(payload.frame)
          commit('setLastFrame', {
            count,
            uniqueCount: count,
            file: payload.framefile
          })
        }

        break
      }

      case 'render': {
        if (!['started', 'running', 'success'].includes(payload.status)) {
          consola.warn('unhandled timelapse render status', payload)
          return
        }

        commit('setRenderStatus', payload)
        break
      }

      default: {
        consola.warn('unhandled timelapse event', payload)
        break
      }
    }
  }
} satisfies ActionTree<TimelapseState, RootState>
