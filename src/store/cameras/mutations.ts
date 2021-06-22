import Vue from 'vue'
import { MutationTree } from 'vuex'
import { CamerasState } from './types'
import { defaultState } from './index'
import { v4 as uuidv4 } from 'uuid'

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
  setInitCameras (state, payload) {
    if (payload) {
      if (payload) Object.assign(state, payload)
    }
  },

  /**
   * Update / Add a temperature preset
   */
  setCamera (state, payload) {
    if (payload.id === -1) {
      payload.id = uuidv4()
      state.cameras.push(payload)
    } else {
      const i = state.cameras.findIndex(camera => camera.id === payload.id)
      if (i >= 0) {
        Vue.set(state.cameras, i, payload)
      }
    }
  },

  /**
   * Remove a camera
   */
  setRemoveCamera (state, payload) {
    const i = state.cameras.findIndex(camera => camera.id === payload.id)
    state.cameras.splice(i, 1)
  },

  /**
   * Sets active camera
   */
  setActiveCamera (state, payload) {
    state.activeCamera = payload
  }
}
