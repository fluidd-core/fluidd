import { PartsState } from './types'

export const defaultState = (): PartsState => {
  return {
    parts: {},
    excludedParts: [],
    printState: 'unknown'
  }
}

export const state = defaultState()
