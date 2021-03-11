import { ActionTree } from 'vuex'
import { Macro, MacrosState } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/socketActions'
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
  }
}
