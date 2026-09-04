import type { ConsoleState } from './types'

export const state = (): ConsoleState => {
  return {
    consoleCommand: '',
    consoleSearch: '',
    consoleEntryCount: 0,
    console: [],
    gcodeHelp: {},
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
