import type { GcodePreviewState } from './types'

export const defaultState = (): GcodePreviewState => {
  return {
    moves: [],
    layers: [],
    parts: [],
    file: undefined,
    parserProgress: 0,
    parserWorker: null,

    viewer: {
      showCurrentLayer: true,
      showNextLayer: false,
      showPreviousLayer: false,
      showMoves: true,
      showExtrusions: true,
      showRetractions: true,
      showParts: true,
      followProgress: false
    }
  }
}

export const state = defaultState()
