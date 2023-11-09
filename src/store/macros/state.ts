import type { MacrosState } from './types'

export const defaultState = (): MacrosState => {
  return {
    stored: [],
    categories: [],
    expanded: [0]
  }
}

export const state = defaultState()
