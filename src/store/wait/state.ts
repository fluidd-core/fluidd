import type { WaitState } from './types'

export const defaultState = (): WaitState => {
  return {
    waits: []
  }
}

export const state = defaultState()
