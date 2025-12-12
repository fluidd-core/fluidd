import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { TimelapseState } from './types'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setSettings (state, payload: Moonraker.Timelapse.SettingsResponse) {
    state.settings = payload
  },

  setLastFrame (state, payload: Moonraker.Timelapse.LastFrameInfoResponse) {
    state.lastFrame = payload
    state.renderStatus = null
  },

  setRenderStatus (state, payload: Moonraker.Timelapse.RenderResponse) {
    state.renderStatus = payload
  }
} satisfies MutationTree<TimelapseState>
