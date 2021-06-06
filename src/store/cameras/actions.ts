import { ActionTree } from 'vuex'
import { CamerasState, CameraConfig } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'

export const actions: ActionTree<CamerasState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Init any file configs we may have.
   */
  async initCameras ({ commit }, payload: { cameras: CameraConfig[] }) {
    commit('setInitCameras', payload)
  },

  /**
   * Add or update a given camera
   */
  async updateCamera ({ commit, state }, payload) {
    commit('setCamera', payload)
    SocketActions.serverWrite('cameras.cameras', state.cameras)
  },

  /**
   * Remove a camera
   */
  async removeCamera ({ commit, state }, payload) {
    commit('setRemoveCamera', payload)
    SocketActions.serverWrite('cameras.cameras', state.cameras)
  },

  /**
   * Sets active camera
   */
  async updateActiveCamera ({ commit }, payload) {
    commit('setActiveCamera', payload)
    SocketActions.serverWrite('cameras.activeCamera', payload)
  }
}
