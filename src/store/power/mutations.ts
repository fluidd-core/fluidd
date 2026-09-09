import type { MutationTree } from 'vuex'
import type { DevicePowerState } from './types'
import { createState } from './state'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, createState())
  },

  setDevices (state, payload: Moonraker.Power.DevicesResponse) {
    state.devices = payload.devices
  },

  setStatus (state, payload: Moonraker.Power.StatusResponse) {
    for (const key in payload) {
      const i = state.devices.findIndex(device => device.device === key)
      if (i >= 0) {
        state.devices[i].status = payload[key]
      }
    }
  }
} satisfies MutationTree<DevicePowerState>
