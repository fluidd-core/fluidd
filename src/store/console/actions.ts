import type { ActionTree } from 'vuex'
import { Globals } from '@/globals'
import type { ConsoleEntry, ConsoleFilter, ConsoleState, PromptDialogButton, PromptDialogItemButton, PromptDialogItemText } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import DOMPurify from 'dompurify'
import { takeRightWhile } from 'lodash-es'

export const actions: ActionTree<ConsoleState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Inits known command history
   */
  async initConsole ({ commit }, payload) {
    commit('setInitConsole', payload)
  },

  /**
   * Add a command history item, and update server store.
   */
  async onUpdateCommandHistory ({ state, commit }, payload) {
    commit('setUpdateCommandHistory', payload)
    SocketActions.serverWrite(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + '.commandHistory', state.commandHistory)
  },

  /**
   * The result of a specific gcode request.
   */
  async onGcodeScript ({ dispatch }, payload) {
    // If the response is not ok, pass it to the console.
    if (payload && payload.result && payload.result !== 'ok') {
      dispatch('onAddConsoleEntry', { message: Globals.CONSOLE_RECEIVE_PREFIX + payload.result })
    }
  },

  /**
   * Add a console entry
   */
  async onAddConsoleEntry ({ commit, dispatch }, payload: ConsoleEntry) {
    payload.message = DOMPurify.sanitize(payload.message).replace(/\r\n|\r|\n/g, '<br />')
    if (!payload.time || payload.time <= 0) {
      payload.time = Date.now() / 1000 | 0
    }
    if (!payload.type) {
      payload.type = 'response'
    }
    if (payload.type === 'response' && payload.message.startsWith('// action:')) {
      payload.type = 'action'
    }

    commit('setConsoleEntry', payload)

    dispatch('onUpdatePromptDialog', payload)
  },

  /**
   * On a fresh load of the UI, we load prior gcode / console history
   */
  async onGcodeStore ({ commit, dispatch }, payload: { gcode_store?: ConsoleEntry[] }) {
    if (payload && payload.gcode_store) {
      const entries = payload.gcode_store
        .map((entry, index: number) => {
          entry.message = Globals.CONSOLE_RECEIVE_PREFIX + entry.message

          entry.message = DOMPurify.sanitize(entry.message).replace(/\r\n|\r|\n/g, '<br />')

          entry.id = index

          if (
            entry.type === 'response' &&
            entry.message.startsWith('// action:')
          ) {
            entry.type = 'action'
          }

          return entry
        })

      commit('setAllEntries', entries)

      const dialogEntries = entries
        .filter(entry => (
          entry.type === 'action' &&
          entry.message.startsWith('// action:prompt_')
        ))

      const dialogEntriesAfterEnd = takeRightWhile(dialogEntries, entry => entry.message !== '// action:prompt_end')
      const dialogEntriesAfterBegin = takeRightWhile(dialogEntriesAfterEnd, entry => entry.message !== '// action:prompt_begin')

      dialogEntriesAfterBegin
        .forEach(entry => dispatch('onUpdatePromptDialog', entry))
    }
  },

  async onUpdatePromptDialog ({ commit }, payload: ConsoleEntry) {
    const parsedMessage = (
      payload.type === 'action' &&
      /^\/\/ action:prompt_([^ ]+)(?: (.+))?/.exec(payload.message)
    )

    if (parsedMessage) {
      const [, type, param] = parsedMessage

      switch (type) {
        case 'begin':
          commit('setResetPromptDialog', param)
          break

        case 'text': {
          const item: PromptDialogItemText = {
            type: 'text',
            text: param
          }

          commit('setPromptDialogItem', item)
          break
        }

        case 'button': {
          const [text, command, color] = param.split('|')

          const item: PromptDialogItemButton = {
            type: 'button',
            text,
            command,
            color
          }

          commit('setPromptDialogItem', item)
          break
        }

        case 'footer_button': {
          const [text, command, color] = param.split('|')

          const item: PromptDialogButton = {
            text,
            command,
            color
          }

          commit('setPromptDialogFooterButton', item)

          break
        }

        case 'show':
        case 'end':
          commit('setPromptDialogOpen', type === 'show')
      }
    }
  },

  /**
   * Klipper provides us with a list of available gcode commands
   * based on the current configuration.
   */
  async onGcodeHelp ({ commit }, payload) {
    commit('setGcodeHelp', payload)
  },

  /**
   * Updates auto scroll value
   */
  async onUpdateAutoScroll ({ commit }, payload) {
    commit('setAutoScroll', payload)
    SocketActions.serverWrite(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + '.autoScroll', payload)
  },

  /**
   * Remove a filter
   */
  async onRemoveFilter ({ commit, state }, filter: ConsoleFilter) {
    commit('setRemoveFilter', filter)
    SocketActions.serverWrite(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + '.consoleFilters', state.consoleFilters)
  },

  /**
    * Add/Edit a filter
    */
  async onSaveFilter ({ commit, state }, filter: ConsoleFilter) {
    commit('setFilter', filter)
    SocketActions.serverWrite(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + '.consoleFilters', state.consoleFilters)
  },

  async onClear ({ commit, state }) {
    commit('setLastCleared')
    SocketActions.serverWrite(Globals.MOONRAKER_DB.fluidd.ROOTS.console.name + '.lastCleared', state.lastCleared)
  }
}
