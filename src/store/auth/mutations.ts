import { MutationTree } from 'vuex'
import { defaultState } from './'
import { AuthState } from './types'
import jwtDecode from 'jwt-decode'

export const mutations: MutationTree<AuthState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setCurrentUser (state, user) {
    state.currentUser = user
  },

  setToken (state, token) {
    state.token = token || null
    state.token_decoded = (token) ? jwtDecode(token) : null
  },

  setRefreshToken (state, token) {
    state.refresh_token = token || null
    state.refresh_token_decoded = (token) ? jwtDecode(token) : null
  },

  setAuthenticated (state, authenticated) {
    state.authenticated = authenticated
  },

  setUsers (state, users) {
    state.users = users
  },

  setAddUser (state, user) {
    state.users.push(user)
  },

  setRemoveUser (state, user) {
    const i = state.users.findIndex(u => u.username === user.username)
    if (i >= 0) state.users.splice(i, 1)
  },

  setApiKey (state, key) {
    state.apiKey = key
  }
}
