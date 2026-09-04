import type { AfcState } from './types'

export const createState = (): AfcState => {
  return {
    dialog: {
      show: false
    }
  }
}
