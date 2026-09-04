import type { WebcamsState } from './types'

export const state = (): WebcamsState => {
  return {
    webcams: [],
    activeWebcam: 'all'
  }
}
