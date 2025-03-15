import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { GcodePreviewState } from './types'
import Vue from 'vue'
import type { AppFile } from '@/store/files/types'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setMoves (state, payload) {
    Vue.set(state, 'moves', Object.freeze(payload.map(Object.freeze)))
  },

  setLayers (state, payload) {
    Vue.set(state, 'layers', Object.freeze(payload.map(Object.freeze)))
  },

  setParts (state, payload) {
    Vue.set(state, 'parts', Object.freeze(payload.map(Object.freeze)))
  },

  setFile (state, file: AppFile) {
    state.file = file
  },

  clearFile (state) {
    state.file = undefined
  },

  setParserProgress (state, payload: number) {
    state.parserProgress = payload
  },

  setParserWorker (state, payload: Worker) {
    state.parserWorker = payload
  }
} satisfies MutationTree<GcodePreviewState>
