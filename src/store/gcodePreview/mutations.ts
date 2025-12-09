import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { GcodePreviewState, Layer, Move, Part, Tool } from './types'
import Vue from 'vue'
import type { AppFile, AppFileWithMeta } from '@/store/files/types'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setMoves (state, payload: Move[]) {
    Vue.set(state, 'moves', Object.freeze(payload.map(Object.freeze)))
  },

  setLayers (state, payload: Layer[]) {
    Vue.set(state, 'layers', Object.freeze(payload.map(Object.freeze)))
  },

  setParts (state, payload: Part[]) {
    Vue.set(state, 'parts', Object.freeze(payload.map(Object.freeze)))
  },

  setTools (state, payload: Tool[]) {
    Vue.set(state, 'tools', Object.freeze(payload))
  },

  setFile (state, file: AppFile | AppFileWithMeta | null) {
    state.file = file
  },

  setParserProgress (state, payload: number) {
    state.parserProgress = payload
  },

  setParserWorker (state, payload: Worker | null) {
    state.parserWorker = payload
  }
} satisfies MutationTree<GcodePreviewState>
