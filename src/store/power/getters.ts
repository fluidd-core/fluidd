import type { GetterTree } from 'vuex'
import type { DevicePowerState } from './types'
import type { RootState } from '../types'

export const getters: GetterTree<DevicePowerState, RootState> = {
  getDevices: (state) => {
    return state.devices
      .filter(device => !device.device.startsWith('_'))
  },

  getDeviceByName: (state) => (name: string) => {
    return state.devices
      .find(device => device.device === name)
  }
}
