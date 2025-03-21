import Vue from 'vue'
import type { MutationTree } from 'vuex'
import type { DevicePowerState } from './types'
import { defaultState } from './state'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setDevices (state, payload) {
    state.devices = payload.devices
  },

  setStatus (state, payload) {
    for (const key in payload) {
      const i = state.devices.findIndex(device => device.device === key)
      if (i >= 0) {
        Vue.set(state.devices[i], 'status', payload[key])
      }
    }
  }
} satisfies MutationTree<DevicePowerState>
