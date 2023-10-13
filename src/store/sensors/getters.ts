import type { GetterTree } from 'vuex'
import type { MoonrakerSensorsState } from './types'
import type { RootState } from '../types'

export const getters: GetterTree<MoonrakerSensorsState, RootState> = {
  getSensors: (state) => {
    return Object.values(state.sensors)
  }
}
