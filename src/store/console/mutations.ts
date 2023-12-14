import Vue from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import { Globals } from '@/globals'
import type { ConsoleEntry, ConsoleFilter, ConsoleState, PromptDialogItemButton, PromptDialogItem } from './types'
import escapeRegExp from '@/util/escape-regexp'

const compileExpression = (filter: ConsoleFilter): RegExp => {
  switch (filter.type) {
    case 'starts-with':
      return new RegExp(`^${escapeRegExp(filter.value)}.*`, 'i')
    case 'expression':
      return new RegExp(filter.value)
    default:
      return new RegExp(`.*${escapeRegExp(filter.value)}.*`, 'i')
  }
}

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

  setResetPromptDialog (state, payload: string) {
    const { promptDialog } = defaultState()

    Object.assign(state, {
      promptDialog: {
        ...promptDialog,
        title: payload
      }
    })
  },

  setPromptDialogItem (state, payload: PromptDialogItem) {
    state.promptDialog.items.push(payload)
  },

  setPromptDialogFooterButton (state, payload: PromptDialogItemButton) {
    state.promptDialog.footerButtons.push(payload)
  },

  setPromptDialogOpen (state, payload: boolean) {
    state.promptDialog.open = payload
  },

  /**
   * Defines the list of available commands
   */
  setGcodeHelp (state, payload) {
    Vue.set(state, 'gcodeHelp', payload)
  },

  /**
   * Inits the console history from db
   */
  setInitConsole (state, payload: ConsoleState) {
    if (payload) {
      if (payload.consoleFilters) {
        payload.consoleFiltersRegexp = payload.consoleFilters
          .map(filter => {
            if (typeof filter.type === 'number') {
              switch (filter.type) {
                case 1:
                  filter.type = 'starts-with'
                  break

                case 2:
                  filter.type = 'expression'
                  break

                default:
                  filter.type = 'contains'
              }
            }

            return compileExpression(filter)
          })
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
    if (filter.id) {
      const i = state.consoleFilters.findIndex(c => c.id === filter.id)
      if (i >= 0) {
        const { type, value } = state.consoleFilters[i]

        Vue.set(state.consoleFilters, i, filter)

        if (type !== filter.type || value !== filter.value) {
          Vue.set(state.consoleFiltersRegexp, i, compileExpression(filter))
        }
      }
    } else {
      filter.id = uuidv4()
      state.consoleFilters.push(filter)
      state.consoleFiltersRegexp.push(compileExpression(filter))
    }
  },

  setRemoveFilter (state, filter: ConsoleFilter) {
    const i = state.consoleFilters.findIndex(c => c.id === filter.id)
    if (i >= 0) {
      state.consoleFilters.splice(i, 1)
      state.consoleFiltersRegexp.splice(i, 1)
    }
  },

  setLastCleared (state) {
    Vue.set(state, 'lastCleared', Date.now())
  }
}
