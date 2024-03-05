import type { GetterTree } from 'vuex'
import type { WebcamConfig, WebcamsState } from './types'
import type { RootState } from '../types'

export const getters: GetterTree<WebcamsState, RootState> = {
  getWebcams: (state) => {
    return [...state.webcams]
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
  },

  getEnabledWebcams: (state, getters) => {
    const webcams = getters.getWebcams as WebcamConfig[]

    return webcams
      .filter(webcam => webcam.enabled)
  },

  getVisibleWebcams: (state, getters) => {
    const enabledWebcams = getters.getEnabledWebcams as WebcamConfig[]

    return state.activeWebcam === 'all'
      ? enabledWebcams
      : enabledWebcams
        .filter(webcam => webcam.uid === state.activeWebcam)
  },

  getWebcamById: (state) => (id: string) => {
    return state.webcams.find(webcam => webcam.uid === id)
  }
}
