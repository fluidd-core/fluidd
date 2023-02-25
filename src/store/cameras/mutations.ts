import Vue from 'vue'
import { MutationTree } from 'vuex'
import { CameraConfig, CamerasState } from './types'
import { defaultState } from './state'

export const mutations: MutationTree<CamerasState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  /**
   * Inits UI settings from the db
   */
  setInitCameras (state, payload: CameraConfig[]) {
    if (payload) {
      Object.assign(state, payload)
    }
  },

  /**
   * Update / Add a camera
   */
  setCamera (state, payload: CameraConfig) {
    const index = state.cameras.findIndex(camera => camera.id === payload.id)

    if (index >= 0) {
      Vue.set(state.cameras, index, payload)
    } else {
      state.cameras.push(payload)
    }
  },

  /**
   * Remove a camera
   */
  setRemoveCamera (state, payload: CameraConfig) {
    const index = state.cameras.findIndex(camera => camera.id === payload.id)

    if (index >= 0) {
      state.cameras.splice(index, 1)
    }

    if (state.activeCamera === payload.id) state.activeCamera = 'all'
  },

  /**
   * Sets active camera
   */
  setActiveCamera (state, payload: string) {
    state.activeCamera = payload
  }
}
