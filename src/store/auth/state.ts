import type { AuthState } from './types'

export const state = (): AuthState => {
  return {
    currentUser: null,
    users: [],
    apiKey: ''
  }
}
