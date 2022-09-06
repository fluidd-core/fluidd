import { MutationTree } from 'vuex'
import { WebcamConfig, WebcamsState } from './types'
import { defaultState } from './index'

export const mutations: MutationTree<WebcamsState> = {
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setWebcamsList (state, payload: { webcams: WebcamConfig[] }) {
    state.webcams = payload.webcams || []
  }
}
