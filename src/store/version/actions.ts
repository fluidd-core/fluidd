import { ActionTree } from 'vuex'
import consola from 'consola'
import { VersionState } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/socketActions'

export const actions: ActionTree<VersionState, RootState> = {
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
  async onUpdateStatus ({ commit }, payload) {
    commit('setRefreshing', false)
    commit('setUpdateStatus', payload)
  },

  /**
   * Tells us if moonraker is in the middle of refreshing
   * the version state.
   */
  async refreshing ({ commit }, payload) {
    commit('setRefreshing', payload)
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
    commit('socket/setSocketDisconnecting', true, { root: true })
  },

  async onUpdatedKlipper (_, payload) {
    consola.debug('Finished updating klipper', payload)
    SocketActions.machineUpdateStatus()
  },

  async onUpdatedClient (_, payload) {
    consola.debug('Finished updating client, reloading', payload)
    window.location.reload()
  },

  async onUpdatedSystem (_, payload) {
    consola.debug('Finished updating system', payload)
    SocketActions.machineUpdateStatus()
  }
}
