import type { ActionTree } from 'vuex'
import type { GcodePreviewState, ParseGcodeWorkerClientMessage, ParseGcodeWorkerServerMessage } from './types'
import type { RootState } from '../types'
import type { AppFile } from '@/store/files/types'
import { consola } from 'consola'
import { fileMaxFlow } from '@/services/control/speed'

import ParseGcodeWorker from '../../workers/parseGcode.worker.ts?worker'

export const actions: ActionTree<GcodePreviewState, RootState> = {
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

  async loadGcode ({ commit, getters, state, rootState }, payload: { file: AppFile; gcode: string }) {
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
              commit('setViewerState', { showParts: false })
            }
          } catch (error) {
            consola.error('Parser worker error', error)
          }

          if (state.parserWorker) {
            commit('setParserWorker', null)

            worker.terminate()
          }

          if (getters.getMoves.length === 0) {
            commit('clearFile')
          }

          break
        }
      }
    })

    commit('setParserProgress', 0)
    commit('setMoves', [])
    commit('setLayers', [])
    // Slicers write their settings at the start or the end; the middle is moves.
    const text = payload.gcode as string
    commit('setMaxFlow', fileMaxFlow(text.length > 400_000 ? `${text.slice(0, 100_000)}\n${text.slice(-300_000)}` : text))

    commit('setFile', payload.file)

    const message: ParseGcodeWorkerServerMessage = {
      action: 'parse',
      gcode: payload.gcode
    }

    worker.postMessage(message)
  }
}
