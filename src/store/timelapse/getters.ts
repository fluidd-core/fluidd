import type { GetterTree } from 'vuex'
import type { TimelapseSettings, TimelapseState } from './types'
import type { RootState } from '../types'

export const getters: GetterTree<TimelapseState, RootState> = {
  getSettings: (state) => {
    return state.settings
  },

  getLastFrame: (state) => {
    return state.lastFrame
  },

  getRenderStatus: (state) => {
    return state.renderStatus
  },

  isBlockedSetting: (state) => {
    return (setting: keyof TimelapseSettings): boolean => state.settings?.blockedsettings.includes(setting) ?? true
  }
}
