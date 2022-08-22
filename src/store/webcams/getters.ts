import { GetterTree } from 'vuex'
import { WebcamsState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<WebcamsState, RootState> = {
  getWebcamsInConfig: (state) => {
    return state.webcams
      .filter(webcam => webcam.source === 'config')
  }
}
