import type { WebcamsState } from './types'

export const createState = (): WebcamsState => {
  return {
    webcams: [],
    activeWebcam: 'all'
  }
}
