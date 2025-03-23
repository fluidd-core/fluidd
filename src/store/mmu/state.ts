import type { MmuState } from './types'

export const defaultState = (): MmuState => {
  return {
    dialog: {
      show: false
    }
  }
}

export const state = defaultState()
