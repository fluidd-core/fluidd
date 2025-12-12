import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { GcodePreviewState, Layer, Move, Part } from './types'
import type { AppFile, AppFileWithMeta } from '@/store/files/types'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setMoves (state, payload: Move[]) {
    state.moves = Object.freeze(payload)
  },

  setLayers (state, payload: Layer[]) {
    state.layers = Object.freeze(payload)
  },

  setParts (state, payload: Part[]) {
    state.parts = Object.freeze(payload)
  },

  setTools (state, payload: number[]) {
    state.tools = Object.freeze(payload)
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
