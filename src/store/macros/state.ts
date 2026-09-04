import type { MacrosState } from './types'

export const createState = (): MacrosState => {
  return {
    stored: [],
    categories: [],
    expanded: [0]
  }
}
