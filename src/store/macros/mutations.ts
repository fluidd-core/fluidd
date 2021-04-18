import Vue from 'vue'
import { MutationTree } from 'vuex'
import { defaultState } from './'
import { Macro, MacrosState } from './types'

export const mutations: MutationTree<MacrosState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  // Sets macro state from db
  initMacros (state, payload: MacrosState) {
    if (payload) Object.assign(state, payload)
  },

  // Updates a singular macro
  setUpdateMacro (state, macro: Macro) {
    const i = state.stored.findIndex(m => m.name === macro.name)
    const processed = {
      name: macro.name,
      category: macro.category?.toLowerCase(),
      color: macro.color,
      visible: macro.visible
    }
    if (i < 0) {
      state.stored.push(processed)
    } else {
      Vue.set(state.stored, i, processed)
    }
  },

  setUpdateAllVisible (state, payload: { macros: Macro[]; visible: boolean }) {
    payload.macros.forEach((macro: Macro) => {
      const i = state.stored.findIndex(m => m.name === macro.name)
      if (i >= 0) Vue.set(state.stored, i, { ...state.stored[i], visible: payload.visible })
    })
  },

  setAddCategory (state, category: string) {
    state.categories.push(category.toLowerCase())
  },

  setEditCategory (state, payload: { previous: string; category: string }) {
    // Edit the category in the category list, and then update all macros.
    const i = state.categories.indexOf(payload.previous)
    const category = payload.category.toLowerCase()
    Vue.set(state.categories, i, category)
    state.stored.forEach((macro, i) => {
      if (macro.category === payload.previous) {
        Vue.set(state.stored, i, { ...macro, category })
      }
    })
  },

  setRemoveCategory (state, payload: string) {
    const category = payload.toLowerCase()
    const i = state.categories.indexOf(category)
    if (i >= 0) {
      state.categories.splice(i, 1)
      state.stored.forEach((macro, i) => {
        if (macro.category === category) {
          const m = { ...macro }
          delete m.category
          Vue.set(state.stored, i, m)
        }
      })
    }
  },

  setExpanded (state, expanded: number[]) {
    state.expanded = expanded
  }
}
