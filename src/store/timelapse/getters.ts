import type { GetterTree } from 'vuex'
import type { TimelapseState } from './types'
import type { RootState } from '../types'

export const getters = {
  getLastFrame: (state) => {
    const lastFrame = state.lastFrame

    if (lastFrame == null) {
      return null
    }

    const uniqueCount = +(lastFrame.lastframefile?.match(/\d+/)?.[0] ?? 0)

    return {
      count: lastFrame.framecount,
      uniqueCount,
      file: lastFrame.lastframefile
    }
  },

  isBlockedSetting: (state) => (setting: string): boolean => {
    return state.settings?.blockedsettings.includes(setting) ?? true
  }
} satisfies GetterTree<TimelapseState, RootState>
