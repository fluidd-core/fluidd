import { ActionTree } from 'vuex'
import { GcodePreviewState } from './types'
import { RootState } from '../types'
import { AppFile } from '@/store/files/types'
import { spawn, Thread, Worker } from 'threads'

/* eslint no-fallthrough: 0 */
export const actions: ActionTree<GcodePreviewState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async loadGcode ({ commit }, payload: { file: AppFile; gcode: string }) {
    const parseGcode = await spawn(new Worker('@/workers/parseGcode.worker'))

    parseGcode.progress().subscribe((filePosition: number) => {
      commit('setParserProgress', filePosition)
    })

    commit('setParserProgress', 0)
    commit('setMoves', [])

    commit('setFile', payload.file)
    commit('setMoves', await parseGcode.parse(payload.gcode))
    commit('setParserProgress', payload.file.size ?? payload.gcode.length)

    await Thread.terminate(parseGcode)
  }
}
