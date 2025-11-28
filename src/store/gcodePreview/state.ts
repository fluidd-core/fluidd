import type { GcodePreviewState } from './types'

export const defaultState = (): GcodePreviewState => {
  return {
    moves: [],
    layers: [],
    parts: [],
    tools: [],
    file: undefined,
    parserProgress: 0,
    parserWorker: null
  }
}

export const state = defaultState()
