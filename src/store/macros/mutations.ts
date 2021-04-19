import Vue from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { MutationTree } from 'vuex'
import { defaultState } from './'
import { Macro, MacroCategory, MacrosState } from './types'

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
    const i = state.stored.findIndex(m => m.name === macro.name)
    console.log('updating macro', macro, i)
    const processed = {
      name: macro.name,
      categoryId: macro.categoryId,
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

  setAddCategory (state, name: string) {
    state.categories.push({ id: uuidv4(), name })
  },

  setEditCategory (state, payload: MacroCategory) {
    // Edit the category in the category list, and then update all macros.
    const i = state.categories.findIndex(category => category.id === payload.id)
    console.log('edit cat', i, payload)
    Vue.set(state.categories, i, {
      id: payload.id,
      name: payload.name
    })
    state.stored.forEach((macro, i) => {
      if (macro.categoryId === payload.id) {
        Vue.set(state.stored, i, { ...macro, categoryId: payload.id })
      }
    })
  },

  setRemoveCategory (state, payload: MacroCategory) {
    const i = state.categories.findIndex(category => category.id === payload.id)
    if (i >= 0) {
      state.categories.splice(i, 1)
      state.stored.forEach((macro, i) => {
        if (macro.categoryId === payload.id) {
          const m = { ...macro }
          delete m.categoryId
          Vue.set(state.stored, i, m)
        }
      })
    }
  },

  setExpanded (state, expanded: number[]) {
    Vue.set(state, 'expanded', expanded)
  }
}
