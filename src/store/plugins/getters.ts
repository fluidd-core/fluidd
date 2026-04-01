import type { GetterTree } from 'vuex'
import type { PluginsState } from './types'
import type { RootState } from '../types'

export const getters: GetterTree<PluginsState, RootState> = {
  getNaviPoints: (state) => {
    return state.naviPoints
  },

  getNaviPointsLoaded: (state) => {
    return state.naviPointsLoaded
  }
}
