import type { WaitState } from './types'

export const createState = (): WaitState => {
  return {
    waits: []
  }
}
