import { GetterTree } from 'vuex'
import { TimelapseState } from './types'
import { RootState } from '../types'

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
    return (setting: string) => state.settings?.blockedsettings.includes(setting) ?? true
  }
}
