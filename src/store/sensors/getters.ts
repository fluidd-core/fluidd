import type { GetterTree } from 'vuex'
import type { RootState } from '../types'
import type { MoonrakerSensorsState } from './types'

export const getters = {
  getSensors: state => {
    return Object.values(state.sensors)
  }
} satisfies GetterTree<MoonrakerSensorsState, RootState>
