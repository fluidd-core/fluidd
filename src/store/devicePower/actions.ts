import { ActionTree } from 'vuex'
import { DevicePowerState } from './types'
import { RootState } from '../types'

export const actions: ActionTree<DevicePowerState, RootState> = {

  /**
   * Inits the list of available devices.
   */
  async init ({ commit }, payload) {
    if (
      payload.devices &&
      payload.devices.length > 0
    ) {
      commit('onDevices', payload)
    }
  },

  /**
   * Fires when we receive a notification of power changing
   */
  async onStatus ({ commit }, payload) {
    commit('onStatus', payload)
  },

  /**
   * On a toggling a power device.
   */
  async onToggle ({ dispatch }, payload) {
    dispatch('onStatus', payload)
  }

}
