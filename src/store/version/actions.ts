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
    // commit('clearUpdateResponse')
    commit('onUpdateStatus', payload)
  },

  /**
   * As updates happen, we get responses here.
   */
  async onUpdateResponse ({ commit }, payload) {
    commit('onUpdateResponse', payload)
  },

  async onUpdatedMoonraker () {
    SocketActions.machineUpdateStatus()
    console.debug('Finished updating moonraker')
  },

  async onUpdatedKlipper () {
    SocketActions.machineUpdateStatus()
    console.debug('Finished updating klipper')
  },

  async onUpdatedClient () {
    SocketActions.machineUpdateStatus()
    console.debug('Finished updating client, reloading')
    window.location.reload()
  },

  async onUpdatedSystem () {
    SocketActions.machineUpdateStatus()
    console.debug('Finished updating system')
  }
}
