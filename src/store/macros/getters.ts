import type { GetterTree } from 'vuex'
import type { Macro, MacrosState } from './types'
import type { RootState } from '../types'

export const MACRO_DEFAULTS = {
  alias: '',
  visible: true,
  disabledWhilePrinting: false,
  color: '',
  categoryId: '0',
  order: undefined
}

export const getters: GetterTree<MacrosState, RootState> = {

  /**
   * Returns all available macros, transformed.
   * Should include the macro's config.
   */
  getMacros: (state, getters, rootState) => {
    const macros = Object.keys(rootState.printer.printer)
      .filter(key => key.startsWith('gcode_macro '))
      .map(key => {
        const lowerCaseKey = key.toLowerCase()
        const name = lowerCaseKey.split(' ', 2)[1]
        const config = rootState.printer.printer.configfile.settings[lowerCaseKey]
        const stored = state.stored.find(macro => macro.name === name)
        const variables = rootState.printer.printer[key]

        const macro: Macro = {
          ...MACRO_DEFAULTS,
          name,
          ...stored,
          variables,
          config
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

    return macros
  },

  getMacroByName: (state, getters) => (...names: string[]) => {
    const macros = getters.getMacros as Macro[]

    for (const name of names) {
      const lowerCaseName = name.toLowerCase()
      const macro = macros.find(macro => macro.name === lowerCaseName)

      if (macro) {
        return macro
      }
    }
  },

  // Gets visible macros, transformed. Should include the macro's config.
  // Is only used on the dashboard. Grouped by category.
  getVisibleMacros: (state, getters) => {
    const defaultCategory = { id: '0', name: null }
    const categories = [...state.categories, defaultCategory]

    return categories
      .map(({ id, name }) => ({
        id,
        name,
        macros: getters.getMacrosByCategory(id).filter((macro: Macro) => macro.visible) as Macro[]
      }))
      .filter(category => category.macros.length > 0)
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
      .filter(macro => (
        !macro.name.startsWith('_') &&
        macro.categoryId === id
      ))
      .sort((a: Macro, b: Macro) => {
        // Sorts preferrentially by order, then by name
        // This offers backward compatibility with macros that have no order
        if ((a.order !== undefined && b.order !== undefined) && a.order !== b.order) {
          return a.order - b.order
        }

        return a.name.localeCompare(b.name)
      })
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

    return categories
  }
}
