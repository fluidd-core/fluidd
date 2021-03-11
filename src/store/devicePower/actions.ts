import { ActionTree } from 'vuex'
import { DevicePowerState } from './types'
import { RootState } from '../types'

export const actions: ActionTree<DevicePowerState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Inits the list of available devices.
   */
  async init ({ commit }, payload) {
    if (
      payload.devices &&
      payload.devices.length > 0
    ) {
      commit('setDevices', payload)
    }
  },

  /**
   * Fires when we receive a notification of power changing
   */
  async onStatus ({ commit }, payload) {
    commit('setStatus', payload)
  },

  /**
   * On toggling a power device.
   */
  async onToggle ({ commit }, payload) {
    commit('setStatus', payload)
  }

}
