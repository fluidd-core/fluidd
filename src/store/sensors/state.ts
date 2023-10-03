import { MoonrakerSensorsState } from './types'

export const defaultState = (): MoonrakerSensorsState => {
  return {
    sensors: {}
  }
}

export const state = defaultState()
