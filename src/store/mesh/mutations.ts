import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { MatrixType, MeshState } from './types'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setMatrix (state, payload: MatrixType) {
    state.matrix = payload
  },

  setScale (state, payload: number) {
    state.scale = payload
  },

  setBoxScale (state, payload: number) {
    state.boxScale = payload
  },

  setWireframe (state, payload: boolean) {
    state.wireframe = payload
  },

  setFlatSurface (state, payload: boolean) {
    state.flatSurface = payload
  }
} satisfies MutationTree<MeshState>
