import type { GetterTree } from 'vuex'
import type { WebcamsState } from './types'
import type { RootState } from '../types'

export const getters: GetterTree<WebcamsState, RootState> = {
  getWebcamsInConfig: (state) => {
    return state.webcams
      .filter(webcam => webcam.source === 'config')
  }
}
