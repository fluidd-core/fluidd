import { ActionTree } from 'vuex'
import { VersionState } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/socketActions'

export const actions: ActionTree<VersionState, RootState> = {
  /**
   * Inits any file config we may have.
   */
  async onUpdateStatus ({ commit }, payload) {
    console.debug('Finished machine.update.status', payload)
    commit('refreshing', false)
    commit('onUpdateStatus', payload)
  },

  /**
   * Tells us if moonraker is in the middle of refreshing
   * the version state.
   */
  async refreshing ({ commit }, payload) {
    commit('refreshing', payload)
  },

  /**
   * As updates happen, we get responses here.
   */
  async onUpdateResponse ({ commit }, payload) {
    commit('onUpdateResponse', payload)
  },

  async onUpdatedMoonraker (_, payload) {
    console.debug('Finished updating moonraker', payload)
    SocketActions.machineUpdateStatus()
  },

  async onUpdatedKlipper (_, payload) {
    console.debug('Finished updating klipper', payload)
    SocketActions.machineUpdateStatus()
  },

  async onUpdatedClient (_, payload) {
    console.debug('Finished updating client, reloading', payload)
    window.location.reload()
  },

  async onUpdatedSystem (_, payload) {
    console.debug('Finished updating system', payload)
    SocketActions.machineUpdateStatus()
  }
}
