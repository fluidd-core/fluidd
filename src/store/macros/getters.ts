import { GetterTree } from 'vuex'
import { groupBy, sortBy, mapValues } from 'lodash-es'
import { Macro, MacroCategory, MacrosState } from './types'
import { RootState } from '../types'
import i18n from '@/plugins/i18n'

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
          ...stored,
          color: '',
          ...{ config }
        }

        // Handle categories that no longer exist.
        if (stored && stored.category && !state.categories.includes(stored.category)) {
          delete r.category
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
      result.push({
        name: category.name,
        macros: macros
          .filter((macro: Macro) => (macro.category === category.name))
      })
    }
    result.push({
      name: i18n.t('app.general.label.uncategorized'),
      macros: macros.filter((macro: Macro) => (macro.category === undefined))
    })
    // const grouped = groupBy(macros, macro => macro.category)
    return result
  },

  /**
   * Returns all macros, transformed - given a category.
   * If no category is passed, return all those that are uncategorized.
   */
  getMacrosByCategory: (state, getters) => (category?: string) => {
    const cat = (!category)
      ? undefined
      : category
    return getters.getMacros.filter((macro: Macro) => {
      // If we have both categories, return if they match.
      if (macro.category && cat) {
        return (macro.category === cat)
      }

      // If we're given no category, only return those that have none, being
      // uncategorized.
      if (!cat) return (macro.category === '' || macro.category === undefined)

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
        const macros = getters.getMacrosByCategory(category)
        const count = macros.length
        const visible = macros.filter((macro: Macro) => macro.visible).length
        return {
          name: category,
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
  },

  /**
   * Returns a boolean indicating if we have any visible macros.
   */
  hasVisibleMacros: (state, getters): boolean => {
    return (getters.getMacros.filter((macro: Macro) => macro.visible).length)
  }
}
