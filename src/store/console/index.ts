import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { ConsoleState } from './types'
import { RootState } from '../types'

/**
 * Maintains the state of the console
 */
export const defaultState = (): ConsoleState => {
  return {
    consoleCommand: '',
    consoleEntryCount: 0,
    console: [],
    availableCommands: {},
    commandHistory: []
  }
}

export const state = defaultState()

const namespaced = true

export const console: Module<ConsoleState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
