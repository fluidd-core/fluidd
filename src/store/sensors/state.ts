import type { MoonrakerSensorsState } from './types'

export const defaultState = (): MoonrakerSensorsState => {
  return {
    sensors: {},
    expanded: []
  }
}

export const state = defaultState()
