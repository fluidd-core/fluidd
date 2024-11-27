import Vue from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { Macro, MacroCategory, MacrosState } from './types'
import { MACRO_DEFAULTS } from '@/store/macros/getters'

const sanitizeMacroForStorage = (macro: Macro) => {
  for (const key in macro) {
    if (!(key === 'name' || key in MACRO_DEFAULTS)) {
      delete macro[key as keyof Macro]
    }
  }

  return macro
}

export const mutations: MutationTree<MacrosState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  // Sets macro state from db
  initMacros (state, payload: MacrosState) {
    if (payload && payload.categories) {
      if (typeof payload.categories[0] === 'string') payload.categories = []
    }
    if (payload) Object.assign(state, payload)
  },

  // Updates a singular macro
  setUpdateMacro (state, macro: Macro) {
    const m = sanitizeMacroForStorage({ ...macro })
    const i = state.stored.findIndex(m => m.name === macro.name)
    if (i < 0) {
      state.stored.push(m)
    } else {
      Vue.set(state.stored, i, m)
    }
  },

  setUpdateAllVisible (state, payload: { macros: Macro[]; visible: boolean }) {
    payload.macros.forEach((macro: Macro) => {
      const i = state.stored.findIndex(m => m.name === macro.name)
      const processed = sanitizeMacroForStorage({
        ...macro,
        visible: payload.visible
      })
      if (i < 0) {
        state.stored.push(processed)
      } else {
        Vue.set(state.stored, i, processed)
      }
    })
  },

  setAddCategory (state, name: string) {
    state.categories.push({ id: uuidv4(), name })
  },

  setEditCategory (state, payload: MacroCategory) {
    // Edit the category in the category list, and then update all macros.
    const i = state.categories.findIndex(category => category.id === payload.id)
    Vue.set(state.categories, i, {
      id: payload.id,
      name: payload.name
    })
  },

  setRemoveCategory (state, payload: MacroCategory) {
    const i = state.categories.findIndex(category => category.id === payload.id)
    if (i >= 0) {
      state.categories.splice(i, 1)
      state.stored.forEach((macro, i) => {
        if (macro.categoryId === payload.id) {
          const m = sanitizeMacroForStorage({ ...macro })
          delete m.categoryId
          Vue.set(state.stored, i, m)
        }
      })
    }
  },

  setUpdateCategories (state, payload: MacroCategory[]) {
    state.categories = payload
  },

  setExpanded (state, expanded: number[]) {
    Vue.set(state, 'expanded', expanded)
  }
}
