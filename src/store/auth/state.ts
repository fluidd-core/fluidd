import type { AuthState } from './types'

export const defaultState = (): AuthState => {
  return {
    currentUser: null,
    users: [],
    apiKey: ''
  }
}

export const state = defaultState()
