import type { ActionTree } from 'vuex'
import type { GcodePreviewState } from './types'
import type { RootState } from '../types'
import type { AppFile } from '@/store/files/types'
import { EventBus } from '@/eventBus'
import i18n from '@/plugins/i18n'
import { consola } from 'consola'

import type { ParseGcodeWorkerClientMessage, ParseGcodeWorkerServerMessage } from '@/workers/parseGcode.worker'

import ParseGcodeWorker from '@/workers/parseGcode.worker.ts?worker'

export const actions = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async terminateParserWorker ({ commit, state }) {
    const worker = state.parserWorker

    if (worker) {
      commit('setParserWorker', null)

      worker.terminate()

      commit('clearFile')
    }
  },

  async loadGcode ({ commit, state, rootState, dispatch }, payload: { file: AppFile; gcode: ArrayBuffer }) {
    const worker = new ParseGcodeWorker()

    commit('setParserWorker', worker)

    worker.addEventListener('message', (event: MessageEvent<ParseGcodeWorkerClientMessage>) => {
      const data = event.data

      switch (data.action) {
        case 'progress': {
          commit('setParserProgress', data.filePosition)
          break
        }

        case 'result': {
          try {
            commit('setMoves', data.moves)
            commit('setLayers', data.layers)
            commit('setParts', data.parts)
            commit('setParserProgress', payload.file.size ?? payload.gcode.byteLength)

            if (rootState.config.uiSettings.gcodePreview.hideSinglePartBoundingBox && data.parts.length <= 1) {
              dispatch('config/saveByPath', {
                path: 'uiSettings.gcodePreview.showParts',
                value: false,
                server: true
              }, { root: true })
            }
          } catch (e) {
            consola.error('Error parsing g-code file', e)

            EventBus.$emit(i18n.t('app.general.msg.gcode_preview_failed').toString(), { type: 'error' })
          }

          if (state.parserWorker) {
            commit('setParserWorker', null)

            worker.terminate()
          }

          if (state.moves.length === 0) {
            commit('clearFile')
          }

          break
        }

        case 'error': {
          dispatch('terminateParserWorker')

          EventBus.$emit(i18n.t('app.general.msg.gcode_preview_failed').toString(), { type: 'error' })

          break
        }
      }
    })

    commit('setParserProgress', 0)
    commit('setMoves', [])
    commit('setLayers', [])

    commit('setFile', payload.file)

    const message: ParseGcodeWorkerServerMessage = {
      action: 'parse',
      gcode: payload.gcode
    }

    worker.postMessage(message, [payload.gcode])
  }
} satisfies ActionTree<GcodePreviewState, RootState>
