import type { WaitState } from './types'

export const state = (): WaitState => {
  return {
    waits: []
  }
}
