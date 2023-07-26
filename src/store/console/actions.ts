import { ActionTree } from 'vuex'
import { Globals } from '@/globals'
import { ConsoleEntry, ConsoleFilter, ConsoleState } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import DOMPurify from 'dompurify'

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
    SocketActions.serverWrite(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + '.commandHistory', state.commandHistory)
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
    payload.message = DOMPurify.sanitize(payload.message).replace(/(?:\r\n|\r|\n)/g, '<br />')
    if (!payload.time || payload.time <= 0) {
      payload.time = Date.now() / 1000 | 0
    }
    if (!payload.type) {
      payload.type = 'response'
    }
    commit('setConsoleEntry', payload)
  },

  /**
   * On a fresh load of the UI, we load prior gcode / console history
   */
  async onGcodeStore ({ commit }, payload) {
    if (payload && payload.gcode_store) {
      const entries = payload.gcode_store.map((s: ConsoleEntry, i: number) => {
        s.message = Globals.CONSOLE_RECEIVE_PREFIX + s.message
        s.message = DOMPurify.sanitize(s.message).replace(/(?:\r\n|\r|\n)/g, '<br />')
        s.id = i
        return s
      })
      commit('setAllEntries', entries)
    }
  },

  /**
   * Klipper provides us with a list of available gcode commands
   * based on the current configuration.
   */
  async onGcodeHelp ({ commit }, payload) {
    commit('setGcodeHelp', payload)
  },

  /**
   * Updates auto scroll value
   */
  async onUpdateAutoScroll ({ commit }, payload) {
    commit('setAutoScroll', payload)
    SocketActions.serverWrite(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + '.autoScroll', payload)
  },

  /**
   * Remove a filter
   */
  async onRemoveFilter ({ commit, state }, filter: ConsoleFilter) {
    commit('setRemoveFilter', filter)
    SocketActions.serverWrite(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + '.consoleFilters', state.consoleFilters)
  },

  /**
    * Add/Edit a filter
    */
  async onSaveFilter ({ commit, state }, filter: ConsoleFilter) {
    commit('setFilter', filter)
    SocketActions.serverWrite(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + '.consoleFilters', state.consoleFilters)
  },

  async onClear ({ commit, state }) {
    commit('setLastCleared')
    SocketActions.serverWrite(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + '.lastCleared', state.lastCleared)
  }
}
