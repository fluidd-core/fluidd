import type { ActionTree } from 'vuex'
import type { MeshState } from './types'
import type { RootState } from '../types'

export const actions = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async onMatrix ({ commit }, payload) {
    commit('setMatrix', payload)
  },

  async onScale ({ commit }, payload) {
    commit('setScale', payload)
  },

  async onBoxScale ({ commit }, payload) {
    commit('setBoxScale', payload)
  },

  async onWireframe ({ commit }, payload) {
    commit('setWireframe', payload)
  },

  async onFlatSurface ({ commit }, payload) {
    commit('setFlatSurface', payload)
  }
} satisfies ActionTree<MeshState, RootState>
