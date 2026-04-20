import type { AuthState } from './types'

export const defaultState = (): AuthState => {
  return {
    token: null,
    refresh_token: null,
    currentUser: null,
    users: [],
    apiKey: ''
  }
}

export const state = defaultState()
