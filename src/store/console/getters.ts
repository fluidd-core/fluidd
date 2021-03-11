import { GetterTree } from 'vuex'
import { ConsoleState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<ConsoleState, RootState> = {
  /**
   * Return a list of all available console entries, filtered appropriately.
   */
  getConsoleEntries: (state, getters, rootState) => {
    const hideTempWaits = (rootState && rootState.config)
      ? rootState.config.uiSettings.general.hideTempWaits
      : true

    const regex = /^(b|t\d+):\d+\.\d+ \/\d+\.+\d+/i

    return (hideTempWaits)
      ? state.console.filter(entry => !regex.test(entry.message))
      : [...state.console]
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
      'GET_POSITION'
    ]
    additional.forEach(command => {
      if (command in commands !== true) {
        commands[command] = ''
      }
    })

    return commands
  }
}
