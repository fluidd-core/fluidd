import type { GetterTree } from 'vuex'
import type { WebcamsState } from './types'
import type { RootState } from '../types'

export const getters = {
  getWebcams: (state) => {
    return [...state.webcams]
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
  },

  getEnabledWebcams: (state, getters) => {
    const webcams: Moonraker.Webcam.Entry[] = getters.getWebcams

    return webcams
      .filter(webcam => webcam.enabled)
  },

  getVisibleWebcams: (state, getters) => {
    const enabledWebcams: Moonraker.Webcam.Entry[] = getters.getEnabledWebcams

    return state.activeWebcam === 'all'
      ? enabledWebcams
      : enabledWebcams
        .filter(webcam => webcam.uid === state.activeWebcam)
  },

  getWebcamById: (state) => (id: string) => {
    return state.webcams.find(webcam => webcam.uid === id)
  }
} satisfies GetterTree<WebcamsState, RootState>
