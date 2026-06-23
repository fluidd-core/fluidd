import type { ActionTree } from 'vuex'
import type { MatrixType, MeshState } from './types'
import type { RootState } from '../types'

export const actions = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async onMatrix ({ commit }, payload: MatrixType) {
    commit('setMatrix', payload)
  },

  async onScale ({ commit }, payload: number) {
    commit('setScale', payload)
  },

  async onBoxScale ({ commit }, payload: number) {
    commit('setBoxScale', payload)
  },

  async onWireframe ({ commit }, payload: boolean) {
    commit('setWireframe', payload)
  },

  async onFlatSurface ({ commit }, payload: boolean) {
    commit('setFlatSurface', payload)
  }
} satisfies ActionTree<MeshState, RootState>
