import { GetterTree } from 'vuex'
import { Macro, MacroCategory, MacrosState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<MacrosState, RootState> = {

  /**
   * Returns all available macros, transformed.
   * Should include the macro's config.
   */
  getMacros: (state, getters, rootState) => {
    const macros: Macro[] = Object.keys(rootState.printer?.printer.configfile.settings)
      .filter(key => key.startsWith('gcode_macro'))
      .map(key => {
        const name = key.split(' ')[1]
        const config = rootState.printer?.printer.configfile.settings[key]
        const stored = state.stored.find(macro => macro.name === name)

        const r: Macro = {
          name,
          visible: true,
          color: '',
          categoryId: '0',
          ...stored,
          ...{ config }
        }

        // Handle categories, incl those that no longer exist.
        let category: MacroCategory | undefined
        if (stored && stored.categoryId) {
          category = state.categories.find(category => category.id === stored.categoryId)
          if (category) {
            r.category = category
          } else {
            r.categoryId = '0'
          }
        }

        return r
      })
      .sort((a, b) => {
        const name1 = a.name.toLowerCase()
        const name2 = b.name.toLowerCase()
        return (name1 < name2) ? -1 : (name1 > name2) ? 1 : 0
      })
    return macros
  },

  // Gets visible macros, transformed. Should include the macro's config.
  // Is only used on the dashboard. Grouped by category.
  getVisibleMacros: (state, getters) => {
    const result = []
    const macros: Macro[] = getters.getMacros.filter((macro: Macro) => (macro.visible === undefined || macro.visible === true))
    const categories: MacroCategory[] = getters.getCategories
    for (const category of categories) {
      const m = macros.filter((macro: Macro) => (macro.categoryId === category.id))
      if (m.length > 0) {
        result.push({
          id: category.id,
          name: category.name,
          macros: m
        })
      }
    }
    return result
  },

  /**
   * Returns all macros, transformed - given a category.
   * If no category is passed, return all those that are uncategorized.
   */
  getMacrosByCategory: (state, getters) => (categoryId?: string) => {
    const id = (!categoryId)
      ? '0'
      : categoryId
    return getters.getMacros.filter((macro: Macro) => {
      // If we have both categories, return if they match.
      if (macro.categoryId && id) {
        return (macro.categoryId === id)
      }

      // If we're given no category, only return those that have none, being
      // uncategorized.
      // if (!id) return (!macro.categoryId)

      // Otherwise return false
      return false
    })
  },

  /**
   * Returns a list of configured categories, and the count of macros inside of
   * them.
   */
  getCategories: (state, getters) => {
    const categories = state.categories
      .map(category => {
        const macros = getters.getMacrosByCategory(category.id)
        const count = macros.length
        const visible = macros.filter((macro: Macro) => macro.visible).length
        return {
          id: category.id,
          name: category.name,
          visible,
          count
        }
      })
      .sort((a, b) => {
        const name1 = a.name.toLowerCase()
        const name2 = b.name.toLowerCase()
        return (name1 < name2) ? -1 : (name1 > name2) ? 1 : 0
      })

    return categories
  }
}
