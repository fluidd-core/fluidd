import { ActionTree } from 'vuex'
import { MeshState } from './types'
import { RootState } from '../types'

export const actions: ActionTree<MeshState, RootState> = {
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

  async onWireframe ({ commit }, payload) {
    commit('setWireframe', payload)
  },

  async onFlatSurface ({ commit }, payload) {
    commit('setFlatSurface', payload)
  }
}
