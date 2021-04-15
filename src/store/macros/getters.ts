import { GetterTree } from 'vuex'
import { Macro, MacrosState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<MacrosState, RootState> = {

  /**
   * Returns all available macros, transformed. Should include
   * a macro config too.
   */
  getMacros: (state, getters, rootState) => {
    const macros: Macro[] = Object.keys(rootState.printer?.printer.configfile.settings)
      .filter(key => key.startsWith('gcode_macro'))
      .map(key => {
        const name = key.split(' ')[1]
        const config = rootState.printer?.printer.configfile.settings[key]
        return {
          name,
          visible: true,
          ...state.stored.find(macro => macro.name === name),
          ...{ config }
        }
      })
    return macros
  },

  /**
   * Returns a boolean indicating if we have any visible macros.
   */
  hasVisibleMacros: (state, getters): boolean => {
    return (getters.getMacros.filter((macro: Macro) => macro.visible).length)
  }
}
