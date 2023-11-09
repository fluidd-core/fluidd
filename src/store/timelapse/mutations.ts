import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { TimelapseState, TimelapseLastFrame, TimelapseSettings, RenderStatus } from './types'

export const mutations: MutationTree<TimelapseState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setSettings (state, payload: TimelapseSettings) {
    state.settings = payload
  },

  setLastFrame (state, payload: TimelapseLastFrame) {
    state.lastFrame = payload
    state.renderStatus = undefined
  },

  setRenderStatus (state, payload: RenderStatus) {
    state.renderStatus = payload
  }
}
