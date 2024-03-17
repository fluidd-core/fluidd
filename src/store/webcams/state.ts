import type { WebcamsState } from './types'

export const defaultState = (): WebcamsState => {
  return {
    webcams: [],
    activeWebcam: 'all'
  }
}

export const state = defaultState()
