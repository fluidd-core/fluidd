import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { MeshState } from './types'

export const mutations: MutationTree<MeshState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setMatrix (state, payload) {
    state.matrix = payload
  },

  setScale (state, payload) {
    state.scale = payload
  },

  setBoxScale (state, payload) {
    state.boxScale = payload
  },

  setWireframe (state, payload) {
    state.wireframe = payload
  },

  setFlatSurface (state, payload) {
    state.flatSurface = payload
  }
}
