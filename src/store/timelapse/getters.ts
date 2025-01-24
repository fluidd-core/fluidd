import type { GetterTree } from 'vuex'
import type { TimelapseSettings, TimelapseState } from './types'
import type { RootState } from '../types'

export const getters: GetterTree<TimelapseState, RootState> = {
  isBlockedSetting: (state) => (setting: keyof TimelapseSettings): boolean => {
    return state.settings?.blockedsettings.includes(setting) ?? true
  }
}
