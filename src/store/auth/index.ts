import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { AuthState } from './types'
import { RootState } from '../types'

/**
 * Maintains the state of the console
 */
export const defaultState = (): AuthState => {
  return {
    authenticated: false,
    token: null,
    refresh_token: null,
    currentUser: null,
    users: [],
    apiKey: ''
  }
}

export const state = defaultState()

const namespaced = true

export const auth: Module<AuthState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
