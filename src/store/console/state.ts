import type { ConsoleState } from './types'

export const defaultState = (): ConsoleState => {
  return {
    consoleCommand: '',
    consoleEntryCount: 0,
    console: [],
    availableCommands: {},
    commandHistory: [],
    autoScroll: true,
    lastCleared: 0,
    promptDialog: {
      open: false,
      items: [],
      footerButtons: []
    },
    consoleFilters: [],
    consoleFiltersRegexp: []
  }
}

export const state = defaultState()
