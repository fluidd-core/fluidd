import type { DevicePowerState } from './types'

export const createState = (): DevicePowerState => {
  return {
    devices: []
  }
}
