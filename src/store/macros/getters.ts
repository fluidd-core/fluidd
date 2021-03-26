import { GetterTree } from 'vuex'
import { Macro, MacrosState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<MacrosState, RootState> = {

  /**
   * Returns all available macros, transformed.
   */
  getMacros: (state, getters, rootState) => {
    const macros: Macro[] = []
    for (const key of rootState.printer?.printer.objects) {
      if (key.startsWith('gcode_macro')) {
        const name = key.split('.')[1]
        const storedMacro = state.stored.find(macro => macro.name === name)
        const macro = {
          name,
          visible: true,
          ...storedMacro
        }
        macros.push(macro)
      }
    }
    return macros
  },

  hasVisibleMacros: (state, getters) => {
    return getters.getMacros.filter((macro: Macro) => macro.visible).length
  }
}
