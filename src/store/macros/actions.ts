import { ActionTree } from 'vuex'
import { Macro, MacroCategory, MacrosState } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'

export const actions: ActionTree<MacrosState, RootState> = {
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
    SocketActions.serverWrite(Globals.MOONRAKER_DB.ROOTS.macros.name + '.stored', state.stored)
  },

  saveAllOn ({ state, commit }, macros) {
    // Commit the change...
    commit('setUpdateAllVisible', { macros, visible: true })

    // Save to moonraker.
    SocketActions.serverWrite(Globals.MOONRAKER_DB.ROOTS.macros.name + '.stored', state.stored)
  },

  saveAllOff ({ state, commit }, macros) {
    // Commit the change...
    commit('setUpdateAllVisible', { macros, visible: false })

    // Save to moonraker.
    SocketActions.serverWrite(Globals.MOONRAKER_DB.ROOTS.macros.name + '.stored', state.stored)
  },

  addCategory ({ commit, state }, category: string) {
    commit('setAddCategory', category)

    // Save to moonraker.
    SocketActions.serverWrite(Globals.MOONRAKER_DB.ROOTS.macros.name + '.categories', state.categories)
  },

  editCategory ({ commit, state }, payload: MacroCategory) {
    commit('setEditCategory', payload)

    // Save to moonraker.
    SocketActions.serverWrite(Globals.MOONRAKER_DB.ROOTS.macros.name, state)
  },

  removeCategory ({ commit, state }, category: MacroCategory) {
    commit('setRemoveCategory', category)

    // Save to moonraker.
    SocketActions.serverWrite(Globals.MOONRAKER_DB.ROOTS.macros.name, state)
  },

  saveExpanded ({ commit, state }, expanded: number[]) {
    commit('setExpanded', expanded)

    // Save to moonraker.
    SocketActions.serverWrite(Globals.MOONRAKER_DB.ROOTS.macros.name + '.expanded', state.expanded)
  }
}
