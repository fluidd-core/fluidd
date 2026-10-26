import { markRaw } from 'vue'
import type { MutationTree } from 'vuex'
import { createState } from './state'
import type { BBox, ExtrusionRole, GcodePreviewState, Layer, MoveStore, Part, ValueRange } from './types'
import type { AppFile, AppFileWithMeta } from '@/store/files/types'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, createState())
  },

  setMoves (state, payload: MoveStore) {
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

  setRoles (state, payload: ExtrusionRole[]) {
    state.roles = Object.freeze(payload)
  },

  setSpeedRange (state, payload: ValueRange | null) {
    state.speedRange = payload != null
      ? Object.freeze(payload)
      : null
  },

  setFanRange (state, payload: ValueRange | null) {
    state.fanRange = payload != null
      ? Object.freeze(payload)
      : null
  },

  setBounds (state, payload: BBox) {
    state.bounds = Object.freeze(payload)
  },

  setFile (state, file: AppFile | AppFileWithMeta | null) {
    state.file = file
  },

  setParserProgress (state, payload: number) {
    state.parserProgress = payload
  },

  setParserWorker (state, payload: Worker | null) {
    state.parserWorker = payload != null
      ? markRaw(payload)
      : null
  }
} satisfies MutationTree<GcodePreviewState>
