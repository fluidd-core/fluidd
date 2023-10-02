import { GetterTree } from 'vuex'
import { MoonrakerSensorsState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<MoonrakerSensorsState, RootState> = {
  getSensors: (state) => {
    return Object.values(state.sensors)
  }
}
