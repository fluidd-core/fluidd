import { ConsoleState } from './types'

export const defaultState = (): ConsoleState => {
  return {
    consoleCommand: '',
    consoleEntryCount: 0,
    console: [],
    availableCommands: {},
    commandHistory: [],
    autoScroll: true,
    lastCleared: 0,
    consoleFilters: [],
    consoleFiltersRegexp: []
  }
}

export const state = defaultState()
