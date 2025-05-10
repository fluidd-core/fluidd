import type { VersionState } from './types'

export const defaultState = (): VersionState => {
  return {
    status: null,
    responses: [],
  }
}

export const state = defaultState()
