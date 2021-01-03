import { ActionTree } from 'vuex'
import { VersionState } from './types'
import { RootState } from '../types'

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

  async onUpdatedMoonraker ({ commit }, payload) {
    commit('onUpdateStatus', payload)
    console.debug('Finished updating moonraker')
  },

  async onUpdatedKlipper ({ commit }, payload) {
    commit('onUpdateStatus', payload)
    console.debug('Finished updating klipper')
  },

  async onUpdatedClient ({ commit }, payload) {
    commit('onUpdateStatus', payload)
    console.debug('Finished updating client, reloading')
    window.location.reload()
  },

  async onUpdatedSystem ({ commit }, payload) {
    commit('onUpdateStatus', payload)
    console.debug('Finished updating system')
  }
}
