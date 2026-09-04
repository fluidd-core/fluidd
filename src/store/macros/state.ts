import type { MacrosState } from './types'

export const state = (): MacrosState => {
  return {
    stored: [],
    categories: [],
    expanded: [0]
  }
}
