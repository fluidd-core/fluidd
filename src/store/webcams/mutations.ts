import type { MutationTree } from 'vuex'
import type { WebcamConfig, WebcamsState } from './types'
import { defaultState } from './state'

export const mutations: MutationTree<WebcamsState> = {
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setWebcamsList (state, payload: { webcams: WebcamConfig[] }) {
    state.webcams = payload.webcams || []
  }
}
