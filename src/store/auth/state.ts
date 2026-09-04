import type { AuthState } from './types'

export const createState = (): AuthState => {
  return {
    currentUser: null,
    users: [],
    apiKey: ''
  }
}
