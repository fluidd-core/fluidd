import Vue from 'vue'
import type { MutationTree } from 'vuex'
import type { WebcamsState } from './types'
import { defaultState } from './state'

export const mutations = {
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setInitWebcams (state, payload: { activeWebcam?: string }) {
    state.activeWebcam = payload.activeWebcam || 'all'
  },

  setWebcamsList (state, payload: Moonraker.Webcam.ListResponse) {
    state.webcams = payload.webcams || []
  },

  setUpdateWebcam (state, payload: Moonraker.Webcam.Entry) {
    const index = state.webcams.findIndex(webcam => webcam.uid === payload.uid)

    if (index >= 0) {
      Vue.set(state.webcams, index, payload)
    } else {
      state.webcams.push(payload)
    }
  },

  setRemoveWebcam (state, payload: string) {
    const index = state.webcams.findIndex(webcam => webcam.uid === payload)

    if (index >= 0) {
      state.webcams.splice(index, 1)
    }

    if (state.activeWebcam === payload) state.activeWebcam = 'all'
  },

  setActiveWebcam (state, payload: string) {
    state.activeWebcam = payload
  }
} satisfies MutationTree<WebcamsState>
