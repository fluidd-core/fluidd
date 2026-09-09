import type { MmuState } from './types'

export const createState = (): MmuState => {
  return {
    dialog: {
      show: false
    }
  }
}
