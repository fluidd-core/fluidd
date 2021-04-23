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

    commit('setMoves', await parseGcode(payload.gcode))
    commit('setFile', payload.file)

    await Thread.terminate(parseGcode)
  }
}
