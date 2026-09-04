import type { MoonrakerSensorsState } from './types'

export const createState = (): MoonrakerSensorsState => {
  return {
    sensors: {},
    expanded: []
  }
}
