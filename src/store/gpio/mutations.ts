import Vue from 'vue'
import { MutationTree } from 'vuex'
import { GpioState } from './types'
import { defaultState } from './index'

export const mutations: MutationTree<GpioState> = {
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
      const i = state.devices.findIndex(device => device.id === key)
      if (i >= 0) {
        // Vue.set(state.devices, i, payload[key] === 'off' ? 0 : 1)
        Vue.set(state.devices[i], 'state', payload[key] === 'off' ? 0 : 1)
      }
    }
  }
}
