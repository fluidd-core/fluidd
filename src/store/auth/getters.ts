import type { GetterTree } from 'vuex'
import type { AuthState } from './types'
import type { RootState } from '../types'

export const getters: GetterTree<AuthState, RootState> = {
  getAuthenticated: (state): boolean => {
    return state.authenticated
  },

  getCurrentUser: (state) => {
    return state.currentUser
  },

  getUsers: (state) => {
    return state.users
  },

  getToken: (state) => {
    return state.token
  },

  getRefreshToken: (state) => {
    return state.refresh_token
  },

  getApiKey: (state) => {
    return state.apiKey
  }
}
