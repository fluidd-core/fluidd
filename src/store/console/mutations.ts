import Vue from 'vue'
import { MutationTree } from 'vuex'
import { defaultState } from './'
import { Globals } from '@/globals'
import { ConsoleEntry, ConsoleState } from './types'

export const mutations: MutationTree<ConsoleState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  /**
   * Adds a console entry
   */
  setConsoleEntry (state, entry: ConsoleEntry) {
    if (entry.id === undefined) {
      state.consoleEntryCount++
      entry.id = state.consoleEntryCount
    }
    while (state.console.length >= Globals.CONSOLE_HISTORY_RETENTION) {
      state.console.shift()
    }
    state.console.push(entry)
  },

  /**
   * Defines the list of available commands
   */
  setGcodeHelp (state, payload) {
    Vue.set(state, 'availableCommands', payload)
  },

  /**
   * Inits the console history from file
   */
  setUpdateCommandHistory (state, payload: string[]) {
    if (payload) {
      state.commandHistory = [...payload]
    }
  },

  /**
   * Maintains the current console command
   */
  setConsoleCommand (state, payload) {
    state.consoleCommand = payload
  }
}
