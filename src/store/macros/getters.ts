import { GetterTree } from 'vuex'
import { Macro, MacrosState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<MacrosState, RootState> = {

  /**
   * Returns all available macros, transformed.
   * Should include the macro's config.
   */
  getMacros: (state, getters, rootState) => {
    const macros = Object.keys(rootState.printer.printer.configfile.settings)
      .filter(key => /^gcode_macro (?!_)/.test(key))
      .map(key => {
        const name = key.split(' ')[1]
        const config = rootState.printer.printer.configfile.settings[key]
        const stored = state.stored.find(macro => macro.name === name)

        const macro: Macro = {
          name,
          alias: '',
          visible: true,
          disabledWhilePrinting: false,
          color: '',
          categoryId: '0',
          ...stored,
          ...{ config }
        }

        // Handle categories, incl those that no longer exist.
        if (stored?.categoryId) {
          const category = state.categories.find(category => category.id === stored.categoryId)

          if (category) {
            macro.category = category
          } else {
            macro.categoryId = '0'
          }
        }

        return macro
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    return macros
  },

  // Gets visible macros, transformed. Should include the macro's config.
  // Is only used on the dashboard. Grouped by category.
  getVisibleMacros: (state, getters) => {
    const macros = getters.getMacros as Macro[]

    const macrosGrouped = macros
      .filter(macro => macro.visible)
      .reduce((groups, macro) => {
        const key = macro.categoryId ?? '0'

        if (key in groups) {
          groups[key].push(macro)
        } else {
          groups[key] = [macro]
        }

        return groups
      }, {} as Record<string, Macro[]>)

    return Object.entries(macrosGrouped)
      .map(([id, macros]) => ({
        id,
        name: macros[0]?.category?.name,
        macros
      }))
      .sort((a, b) => !a.name ? 1 : !b.name ? -1 : a.name.localeCompare(b.name))
  },

  /**
   * Returns all macros, transformed - given a category.
   * If no category is passed, return all those that are uncategorized.
   */
  getMacrosByCategory: (state, getters) => (categoryId?: string) => {
    const id = !categoryId
      ? '0'
      : categoryId

    const macros = getters.getMacros as Macro[]

    return macros
      .filter(macro => macro.categoryId === id)
  },

  /**
   * Returns a list of configured categories, and the count of macros inside of
   * them.
   */
  getCategories: (state, getters) => {
    const categories = state.categories
      .map(category => {
        const { id, name } = category

        const macros = getters.getMacrosByCategory(id) as Macro[]
        const count = macros.length
        const visible = macros
          .filter(macro => macro.visible)
          .length

        return {
          id,
          name,
          visible,
          count
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    return categories
  }
}
