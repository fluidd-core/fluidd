import type { DatabaseState } from './types'

export const defaultState = (): DatabaseState => {
  return {
    info: null
  }
}

export const state = defaultState()
