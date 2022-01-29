import Vue from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { MutationTree } from 'vuex'
import { defaultState } from './'
import { Globals } from '@/globals'
import { ConsoleEntry, ConsoleFilter, ConsoleState } from './types'

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
   * Sets all console entries from moonraker store.
   */
  setAllEntries (state, payload: ConsoleEntry[]) {
    state.consoleEntryCount = payload.length
    state.console = payload
  },

  /**
   * Defines the list of available commands
   */
  setGcodeHelp (state, payload) {
    Vue.set(state, 'availableCommands', payload)
  },

  /**
   * Inits the console history from db
   */
  setInitConsole (state, payload: ConsoleState) {
    if (payload) {
      if (payload.consoleFilters) {
        payload.consoleFilters.forEach(f => { f.regex = new RegExp(f.expression) })
      }
      Object.assign(state, payload)
    }
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
  },

  /**
   * Sets auto scroll
   */
  setAutoScroll (state, payload) {
    state.autoScroll = payload
  },

  setFilter (state, filter: ConsoleFilter) {
    filter.regex = new RegExp(filter.expression)

    if (filter.id) {
      const i = state.consoleFilters.findIndex(c => c.id === filter.id)
      if (i >= 0) {
        Vue.set(state.consoleFilters, i, filter)
      }
    } else {
      filter.id = uuidv4()
      state.consoleFilters.push(filter)
    }
  },

  setRemoveFilter (state, filter: ConsoleFilter) {
    const i = state.consoleFilters.findIndex(c => c.id === filter.id)
    if (i >= 0) {
      state.consoleFilters.splice(i, 1)
    }
  }
}
