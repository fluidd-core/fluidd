import { GetterTree } from 'vuex'
import { Macro, MacrosState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<MacrosState, RootState> = {

  /**
   * Returns all available macros, transformed.
   */
  getMacros: (state, getters, rootState) => {
    const macros: Macro[] = Object.keys(rootState.printer?.printer.configfile.config)
      .filter(key => key.startsWith('gcode_macro'))
      .map(key => {
        const name = key.split(' ')[1]
        return {
          name,
          visible: true,
          ...state.stored.find(macro => macro.name === name)
        }
      })
    return macros
  },

  /**
   * Returns a boolean indicating if we have any visible macros.
   */
  hasVisibleMacros: (state, getters) => {
    return getters.getMacros.filter((macro: Macro) => macro.visible).length
  }
}
