import type { ActionTree } from 'vuex'
import type { Macro, MacroCategory, MacrosState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'

export const actions = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Init stored macros
   */
  initMacros ({ commit }, payload) {
    commit('initMacros', payload)
  },

  /**
   * Saves the state of a given macro.
   */
  saveMacro ({ state, commit }, macro: Macro) {
    // Commit the change...
    commit('setUpdateMacro', macro)

    // Save to moonraker.
    SocketActions.serverDatabasePostItem(Globals.MOONRAKER_DB.fluidd.ROOTS.macros.name + '.stored', state.stored)
  },

  saveAllOrder ({ state, commit }, macros: Macro[]) {
    // Commit the change...
    macros.forEach((macro, index) => {
      commit('setUpdateMacro', {
        ...macro,
        order: index
      })
    })

    // Save to moonraker.
    SocketActions.serverDatabasePostItem(Globals.MOONRAKER_DB.fluidd.ROOTS.macros.name + '.stored', state.stored)
  },

  saveAllOn ({ state, commit }, macros) {
    // Commit the change...
    commit('setUpdateAllVisible', { macros, visible: true })

    // Save to moonraker.
    SocketActions.serverDatabasePostItem(Globals.MOONRAKER_DB.fluidd.ROOTS.macros.name + '.stored', state.stored)
  },

  saveAllOff ({ state, commit }, macros) {
    // Commit the change...
    commit('setUpdateAllVisible', { macros, visible: false })

    // Save to moonraker.
    SocketActions.serverDatabasePostItem(Globals.MOONRAKER_DB.fluidd.ROOTS.macros.name + '.stored', state.stored)
  },

  addCategory ({ commit, state }, category: string) {
    commit('setAddCategory', category)

    // Save to moonraker.
    SocketActions.serverDatabasePostItem(Globals.MOONRAKER_DB.fluidd.ROOTS.macros.name + '.categories', state.categories)
  },

  editCategory ({ commit, state }, payload: MacroCategory) {
    commit('setEditCategory', payload)

    // Save to moonraker.
    SocketActions.serverDatabasePostItem(Globals.MOONRAKER_DB.fluidd.ROOTS.macros.name + '.categories', state.categories)
  },

  updateCategories ({ commit, state }, payload: MacroCategory[]) {
    commit('setUpdateCategories', payload)

    // Save to moonraker.
    SocketActions.serverDatabasePostItem(Globals.MOONRAKER_DB.fluidd.ROOTS.macros.name + '.categories', state.categories)
  },

  removeCategory ({ commit, state }, category: MacroCategory) {
    commit('setRemoveCategory', category)

    // Save to moonraker.
    SocketActions.serverDatabasePostItem(Globals.MOONRAKER_DB.fluidd.ROOTS.macros.name, state)
  },

  saveExpanded ({ commit, state }, expanded: number[]) {
    commit('setExpanded', expanded)

    // Save to moonraker.
    SocketActions.serverDatabasePostItem(Globals.MOONRAKER_DB.fluidd.ROOTS.macros.name + '.expanded', state.expanded)
  }
} satisfies ActionTree<MacrosState, RootState>
