import type { WebcamsState } from './types'

export const defaultState = (): WebcamsState => {
  return {
    webcams: []
  }
}

export const state = defaultState()
