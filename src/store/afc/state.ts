import type { AfcState } from './types'

export const defaultState = (): AfcState => {
  return {
    dialog: {
      show: false
    }
  }
}

export const state = defaultState()
