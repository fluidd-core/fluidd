import { ActionTree } from 'vuex'
import { GcodePreviewState } from './types'
import { RootState } from '../types'
import { AppFile } from '@/store/files/types'
import { spawn, Thread, Worker } from 'threads'
import consola from 'consola'

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

      await Thread.terminate(worker)
    }
  },

  async loadGcode ({ commit, getters, state, rootState }, payload: { file: AppFile; gcode: string }) {
    const worker = await spawn(new Worker(new URL('@/workers/parseGcode.worker.ts', import.meta.url) as any))

    commit('setParserWorker', worker)

    worker.progress().subscribe((filePosition: number) => {
      commit('setParserProgress', filePosition)
    })

    const abort = new Promise((resolve, reject) => {
      Thread.events(worker).subscribe(event => {
        if (event.type === 'termination') {
          resolve([])
        }
      })

      Thread.errors(worker).subscribe(reject)
    })

    commit('setParserProgress', 0)
    commit('setMoves', [])

    commit('setFile', payload.file)
    if (rootState.config?.uiSettings.gcodePreview.autoFollowOnFileLoad) {
      // check if loaded file equals printed file is handled downstream
      commit('setViewerState', { followProgress: true })
    }

    try {
      commit('setMoves', await Promise.race([abort, worker.parse(payload.gcode)]))
      commit('setParserProgress', payload.file.size ?? payload.gcode.length)
    } catch (error) {
      consola.error('Parser worker error', error)
    }

    if (state.parserWorker) {
      commit('setParserWorker', null)

      await Thread.terminate(worker)
    }

    if (getters.getMoves.length === 0) {
      commit('clearFile')
    }
  }
}
