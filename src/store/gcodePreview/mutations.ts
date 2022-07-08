import { MutationTree } from 'vuex'
import { defaultState } from './'
import { GcodePreviewState } from './types'
import Vue from 'vue'
import { AppFile } from '@/store/files/types'
import { Thread } from 'threads'

export const mutations: MutationTree<GcodePreviewState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setMoves (state, payload) {
    Vue.set(state, 'moves', Object.freeze(payload.map(Object.freeze)))
  },

  setFile (state, file: AppFile) {
    state.file = file
  },

  clearFile (state) {
    state.file = undefined
  },

  setViewerState (state, payload: any) {
    for (const key of Object.keys(state.viewer)) {
      if (payload[key] !== undefined) {
        Vue.set(state.viewer, key, payload[key])
      }
    }
  },

  setParserProgress (state, payload: number) {
    state.parserProgress = payload
  },

  setParserWorker (state, payload: Thread) {
    state.parserWorker = payload
  }
}
