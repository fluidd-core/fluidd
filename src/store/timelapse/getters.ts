import type { GetterTree } from 'vuex'
import type { TimelapseState } from './types'
import type { RootState } from '../types'

export const getters = {
  isBlockedSetting: (state) => (setting: string): boolean => {
    return state.settings?.blockedsettings.includes(setting) ?? true
  }
} satisfies GetterTree<TimelapseState, RootState>
