import type { MutationTree } from 'vuex'
import type { PluginsState, NaviPoint } from './types'

export const mutations: MutationTree<PluginsState> = {
  setReset (state) {
    state.naviPoints = []
    state.naviPointsLoaded = false
  },

  setNaviPoints (state, points: NaviPoint[]) {
    state.naviPoints = points
  },

  setNaviPointsLoaded (state, loaded: boolean) {
    state.naviPointsLoaded = loaded
  }
}
