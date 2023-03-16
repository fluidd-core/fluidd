import { ActionTree } from 'vuex'
import { GcodePreviewState, ParseGcodeWorkerClientMessage, ParseGcodeWorkerServerMessage } from './types'
import { RootState } from '../types'
import { AppFile } from '@/store/files/types'
import consola from 'consola'

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

  async loadGcode ({ commit, getters, state }, payload: { file: AppFile; gcode: string }) {
    const worker = new ParseGcodeWorker()

    commit('setParserWorker', worker)

    worker.addEventListener('message', (e) => {
      const data: ParseGcodeWorkerClientMessage = e.data

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

    commit('setFile', payload.file)

    const message: ParseGcodeWorkerServerMessage = {
      action: 'parse',
      gcode: payload.gcode
    }

    worker.postMessage(message)
  }
}
