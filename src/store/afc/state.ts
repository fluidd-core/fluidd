import type { AfcState } from './types'

export const state = (): AfcState => {
  return {
    dialog: {
      show: false
    }
  }
}
