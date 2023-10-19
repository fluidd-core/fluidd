import type { ActionTree } from 'vuex'
import type { DevicePowerState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'

export const actions: ActionTree<DevicePowerState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Make a socket request to init the moonraker power component.
   */
  async init () {
    SocketActions.machineDevicePowerDevices()
  },

  /**
   * Inits the list of available devices. Notified by init action.
   */
  async onInit ({ commit }, payload) {
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
