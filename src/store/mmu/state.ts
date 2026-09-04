import type { MmuState } from './types'

export const state = (): MmuState => {
  return {
    dialog: {
      show: false
    }
  }
}
