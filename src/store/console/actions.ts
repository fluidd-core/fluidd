import { ActionTree } from 'vuex'
import { Globals } from '@/globals'
import { ConsoleEntry, ConsoleState } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/socketActions'

export const actions: ActionTree<ConsoleState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Inits known command history
   */
  async initConsole ({ commit }, payload) {
    commit('setInitConsole', payload)
  },

  /**
   * Add a command history item, and update server store.
   */
  async onUpdateCommandHistory ({ state, commit }, payload) {
    commit('setUpdateCommandHistory', payload)
    SocketActions.serverWrite(Globals.MOONRAKER_DB.ROOTS.console.name + '.commandHistory', state.commandHistory)
  },

  /**
   * The result of a specific gcode request.
   */
  async onGcodeScript ({ dispatch }, payload) {
    // If the response is not ok, pass it to the console.
    if (payload && payload.result && payload.result !== 'ok') {
      dispatch('onAddConsoleEntry', { message: Globals.CONSOLE_RECEIVE_PREFIX + payload.result })
    }
  },

  /**
   * Add a console entry
   */
  async onAddConsoleEntry ({ commit }, payload: ConsoleEntry) {
    payload.message = payload.message.replace(/(?:\r\n|\r|\n)/g, '<br />')
    if (!payload.time || payload.time <= 0) {
      payload.time = new Date().getTime() / 1000 | 0
    }
    if (!payload.type) {
      payload.type = 'response'
    }
    commit('setConsoleEntry', payload)
  },

  /**
   * On a fresh load of the UI, we load prior gcode / console history
   */
  async onGcodeStore ({ dispatch }, payload) {
    if (payload && payload.gcode_store) {
      payload.gcode_store.forEach((s: ConsoleEntry) => {
        s.message = Globals.CONSOLE_RECEIVE_PREFIX + s.message
        dispatch('onAddConsoleEntry', s)
      })
    }
  },

  /**
   * Klipper provides us with a list of available gcode commands
   * based on the current configuration.
   */
  async onGcodeHelp ({ commit }, payload) {
    commit('setGcodeHelp', payload)
  }
}
