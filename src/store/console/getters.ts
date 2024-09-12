import type { GetterTree } from 'vuex'
import type { ConsoleState, GcodeHelp } from './types'
import type { RootState } from '../types'

const _tempWaitExpr = /^(?:ok\s+)?(?:b|t\d+):\d+\.\d+ \/\d+\.+\d+/i

export const getters: GetterTree<ConsoleState, RootState> = {
  /**
   * Return a list of all available console entries, filtered appropriately.
   */
  getConsoleEntries: (state, getters, rootState) => {
    const hideTempWaits = rootState.config.uiSettings.general.hideTempWaits || true

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

  getAllKnownCommands: (state): GcodeHelp => {
    const commands: GcodeHelp = {
      TESTZ: '',
      ABORT: '',
      ACCEPT: '',
      ADJUSTED: '',
      ...state.gcodeHelp
    }

    return commands
  }
}
