import type { GetterTree } from 'vuex'
import type { Device, DevicePowerState } from './types'
import type { RootState } from '../types'

export const getters: GetterTree<DevicePowerState, RootState> = {
  getDevices: (state) => {
    return state.devices
      .filter(device => !device.device.startsWith('_'))
  },

  getDeviceByName: (state, getters) => (name: string) => {
    const devices = getters.getDevices as Device[]

    return devices.find(device => device.device === name)
  }
}
