import { GetterTree } from 'vuex'
import { ConsoleState } from './types'
import { RootState } from '../types'

const _tempWaitExpr = /^(?:ok\s+)?(b|t\d+):\d+\.\d+ \/\d+\.+\d+/i

export const getters: GetterTree<ConsoleState, RootState> = {
  /**
   * Return a list of all available console entries, filtered appropriately.
   */
  getConsoleEntries: (state, rootState) => {
    const hideTempWaits = rootState.config?.uiSettings.general.hideTempWaits || true

    const items = state.console.filter(entry => {
      return (!entry.time || entry.time * 1000 > state.lastCleared) &&
      (!hideTempWaits || !_tempWaitExpr.test(entry.message)) &&
      (!state.consoleFilters.some((f, i) => f.enabled && state.consoleFiltersRegexp[i].test(entry.message)))
    })

    return items
  },

  getFilters: (state) => {
    return state.consoleFilters
  },

  getAvailableCalibrationCommands: (state) => {
    return Object.keys(state.availableCommands)
      .filter(key => key.endsWith('CALIBRATE'))
      .reduce((o, key) => {
        return {
          ...o,
          [key]: state.availableCommands[key]
        }
      }, {})
  },

  getAllGcodeCommands: (state) => {
    const commands = state.availableCommands
    const additional = [
      'TESTZ',
      'ABORT',
      'ACCEPT',
      'ADJUSTED',
      'GET_POSITION',
      'SET_RETRACTION'
    ]
    additional.forEach(command => {
      if (command in commands !== true) {
        commands[command] = ''
      }
    })

    return commands
  }
}
