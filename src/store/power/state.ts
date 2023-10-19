import type { DevicePowerState } from './types'

export const defaultState = (): DevicePowerState => {
  return {
    devices: []
  }
}

export const state = defaultState()
