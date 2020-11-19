import Vue from 'vue'
import { MutationTree } from 'vuex'
import { DevicePowerState } from './types'
import { defaultState } from './index'

export const mutations: MutationTree<DevicePowerState> = {
  resetState (state) {
    const newState = defaultState()
    Object.keys(newState).forEach((key: string) => {
      Vue.set(state, key, newState[key])
    })
  },

  onDevices (state, payload) {
    state.devices = payload.devices
  },

  onStatus (state, payload) {
    for (const key in payload) {
      const i = state.devices.findIndex(device => device.device === key)
      if (i >= 0) {
        Vue.set(state.devices[i], 'status', payload[key])
      }
    }
  }
}
