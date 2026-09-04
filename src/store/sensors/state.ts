import type { MoonrakerSensorsState } from './types'

export const state = (): MoonrakerSensorsState => {
  return {
    sensors: {},
    expanded: []
  }
}
