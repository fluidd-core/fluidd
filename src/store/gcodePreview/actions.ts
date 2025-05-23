import type { ActionTree } from 'vuex'
import type { GcodePreviewState, ParseGcodeWorkerClientMessage, ParseGcodeWorkerServerMessage } from './types'
import type { RootState } from '../types'
import type { AppFile } from '@/store/files/types'
import { consola } from 'consola'

import ParseGcodeWorker from '../../workers/parseGcode.worker.ts?worker'

export const actions = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async terminateParserWorker ({ commit, state }) {
    if (state.parserWorker) {
      const worker = state.parserWorker

      commit('setParserWorker', null)

      worker.terminate()

      commit('clearFile')
    }
  },

  async loadGcode ({ commit, state, rootState, dispatch }, payload: { file: AppFile; gcode: string }) {
    const worker = new ParseGcodeWorker()

    commit('setParserWorker', worker)

    worker.addEventListener('message', (event) => {
      const data: ParseGcodeWorkerClientMessage = event.data

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
            commit('setParserProgress', payload.file.size ?? payload.gcode.length)

            if (rootState.config.uiSettings.gcodePreview.hideSinglePartBoundingBox && data.parts.length <= 1) {
              dispatch('config/saveByPath', {
                path: 'uiSettings.gcodePreview.showParts',
                value: false,
                server: true
              }, { root: true })
            }
          } catch (error) {
            consola.error('Parser worker error', error)
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

    worker.postMessage(message)
  }
} satisfies ActionTree<GcodePreviewState, RootState>
