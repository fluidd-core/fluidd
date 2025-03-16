import type { ActionTree } from 'vuex'
import { consola } from 'consola'
import type { VersionState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import i18n from '@/plugins/i18n'

export const actions = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Make a socket request to init the version component.
   */
  async init () {
    SocketActions.machineUpdateStatus()
  },

  /**
   * Inits any file config we may have.
   */
  async onUpdateStatus ({ commit, dispatch, getters }, payload) {
    commit('setUpdateStatus', payload)

    if (getters.hasUpdates) {
      dispatch('notifications/pushNotification', {
        id: 'updates-available',
        title: i18n.t('app.version.label.updates_available'),
        to: '/settings#versions',
        btnText: i18n.t('app.version.btn.view_versions'),
        type: 'info',
        merge: true
      }, { root: true })
    } else {
      dispatch('notifications/clearNotification', 'updates-available', { root: true })
    }
  },

  /**
   * As updates happen, we get responses here.
   */
  async onUpdateResponse ({ commit }, payload) {
    commit('setUpdateResponse', payload)
  },

  /**
   * Notifications of specific updates
   */
  async onUpdatedMoonraker ({ commit }, payload) {
    consola.debug('Finished updating moonraker', payload)
    SocketActions.machineUpdateStatus()
    // We do this because moonraker is expected to restart.
    commit('socket/setSocketDisconnecting', true, { root: true })
  },

  async onUpdatedKlipper (_, payload) {
    consola.debug('Finished updating klipper', payload)
    SocketActions.machineUpdateStatus()
  },

  async onUpdatedClient (_, payload) {
    consola.debug('Finished updating a client', payload)
    SocketActions.machineUpdateStatus()
  },

  async onUpdatedFluidd (_, payload) {
    consola.debug('Finished updating fluidd, reloading', payload)
    window.location.reload()
  },

  async onUpdatedSystem (_, payload) {
    consola.debug('Finished updating system', payload)
    SocketActions.machineUpdateStatus()
  },

  async onUpdatedAll (_, payload) {
    consola.debug('Finished updating all services', payload)
    window.location.reload()
  }
} satisfies ActionTree<VersionState, RootState>
