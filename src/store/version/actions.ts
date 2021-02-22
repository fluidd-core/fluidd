import { ActionTree } from 'vuex'
import consola from 'consola'
import { VersionState } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/socketActions'

export const actions: ActionTree<VersionState, RootState> = {
  /**
   * Inits any file config we may have.
   */
  async onUpdateStatus ({ commit }, payload) {
    consola.debug('Finished machine.update.status', payload)
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
    consola.debug('Finished updating moonraker', payload)
    SocketActions.machineUpdateStatus()
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
