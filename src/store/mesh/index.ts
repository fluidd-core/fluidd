import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { MeshState } from './types'
import { RootState } from '../types'

/**
 * Maintains the state of the console
 */
export const defaultState = (): MeshState => {
  return {
    variance: 0,
    wireframe: false,
    scale: 0.2,
    boxScale: 2.0,
    flatSurface: false,
    matrix: 'mesh_matrix'
  }
}

export const state = defaultState()

const namespaced = true

export const mesh: Module<MeshState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
