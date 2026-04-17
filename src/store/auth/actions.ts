import Vue from 'vue'
import type { ActionTree } from 'vuex'
import type { AuthState } from './types'
import type { RootState } from '../types'
import { consola } from 'consola'
import { SocketActions } from '@/api/socketActions'

export const actions = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Inits moonraker component
   */
  async init ({ commit }) {
    await Promise.all([
      // Load current user.
      SocketActions.accessGetUser()
        .then(response => commit('setCurrentUser', response)),

      // Load user list.
      SocketActions.accessUsersList()
        .then(response => commit('setUsers', response.users)),

      // Load our current API key.
      SocketActions.accessGetApiKey()
        .then(response => commit('setApiKey', response)),
    ])
  },

  /**
   * Init auth status / tokens.
   */
  async initAuth ({ commit, rootState, rootGetters }) {
    // No known API?
    // This is likely a new setup with no known instances yet. Set auth to true
    // and move on until we know more.
    if (rootState.config.apiUrl === '') {
      commit('setAuthenticated', true)
      return
    }

    // Load our tokens and apply them if found.
    const keys = rootGetters['config/getTokenKeys']
    const refreshToken = localStorage.getItem(keys['refresh-token'])
    const token = localStorage.getItem(keys['user-token'])
    if (token && refreshToken) {
      commit('setToken', token)
      commit('setRefreshToken', refreshToken)
    }
  },

  /**
   * Inspects the auth token to determine its validity.
   */
  async checkToken ({ state }) {
    if (state.token?.exp) {
      const exp = state.token.exp
      const now = Date.now() / 1000 // now in unixtime.
      const isExpiring = (exp - now) < 300 // refresh within 5 minutes / 5 * 60
      if (isExpiring) {
        consola.debug('checkToken - isExpiring', new Date(now * 1000), new Date(exp * 1000))
        return true
      } else {
        return false
      }
    }
    return false
  },

  /**
   * Refresh the auth tokens.
   */
  async refreshTokens ({ commit, rootGetters }) {
    const keys = rootGetters['config/getTokenKeys']
    const refresh_token = localStorage.getItem(keys['refresh-token'])

    if (!refresh_token) {
      return
    }

    try {
      const response = await SocketActions.accessRefreshJwt(refresh_token)

      // We've successfully retrieved a token. Set the new store data and move on.
      localStorage.setItem(keys['user-token'], response.token)
      commit('setToken', response.token)
      return response.token
    } catch {
      // Error on refresh. Caller is responsible for subsequent action (logout / redirect).
    }
  },

  async getAuthInfo () {
    try {
      const response = await SocketActions.accessInfo()

      return {
        defaultSource: response.default_source,
        availableSources: response.available_sources
      }
    } catch {
      // external authentication sources not supported
      return {}
    }
  },

  async login ({ commit, rootGetters }, { username, password, source }) {
    const keys = rootGetters['config/getTokenKeys']

    try {
      const user = await SocketActions.accessLogin(username, password, source)

      // Successful login. Set the tokens and auth status and move on.
      localStorage.setItem(keys['user-token'], user.token)
      localStorage.setItem(keys['refresh-token'], user.refresh_token)
      commit('setAuthenticated', true)
      commit('setCurrentUser', {
        username: user.username,
        source: user.source
      })
      commit('setToken', user.token)
      commit('setRefreshToken', user.refresh_token)

      return user
    } catch (error: unknown) {
      // Unsuccessful login. Remove any existing keys and propagate the error.
      localStorage.removeItem(keys['user-token'])
      localStorage.removeItem(keys['refresh-token'])
      throw error
    }
  },

  /**
   * Logout the user. Removes their tokens, clears state, and sends them back
   * to the login page. The websocket connection is intentionally kept open so
   * the login view can call access.info / access.login over it.
   */
  async logout ({ commit, rootGetters }, options?: { invalidate: boolean; partial: boolean }) {
    const opts = {
      invalidate: false,
      partial: false,
      ...options
    }

    const keys = rootGetters['config/getTokenKeys']

    // Invalidate all sessions (server-side). The current socket session becomes
    // anonymous; Moonraker does not close the connection.
    if (opts.invalidate) {
      try {
        await SocketActions.accessLogout()
      } catch (e) {
        consola.debug('accessLogout failed', e)
      }
    }

    // Remove the tokens from local storage.
    localStorage.removeItem(keys['user-token'])
    localStorage.removeItem(keys['refresh-token'])

    // Clear the in memory store.
    commit('setCurrentUser', null)
    commit('setToken', null)
    commit('setRefreshToken', null)

    // For a full logout, set unauthenticated and route to login. Partial logouts
    // are used for trusted clients, in that they remain authenticated when
    // logging out.
    if (!opts.partial) {
      commit('setAuthenticated', false)
      if (Vue.$filters.getCurrentRouteName() !== 'login') {
        await Vue.$filters.routeTo({ name: 'login' })
      }
    }
  },

  /**
   * Checks whether the current connection still has passwordless access (i.e.
   * Moonraker reports trusted:true AND login is not required). If so, a partial
   * logout keeps them signed in as the trusted user. Otherwise, a full logout
   * sends them to /login. login_required overrides trusted_clients whenever
   * force_logins is enabled with at least one user configured.
   */
  async checkTrust ({ dispatch, commit }) {
    try {
      const info = await SocketActions.accessInfo()

      if (info.trusted && !info.login_required) {
        await dispatch('logout', { partial: true })

        try {
          const user = await SocketActions.accessGetUser()
          commit('setCurrentUser', user)
        } catch (e) {
          consola.debug('accessGetUser after trust check failed', e)
        }
        return
      }
    } catch (e) {
      consola.debug('accessInfo during checkTrust failed', e)
    }

    // Not trusted or login is required: full logout.
    await dispatch('logout', { invalidate: true })
  },

  async addUser (_, user) {
    await SocketActions.accessPostUser(user.username, user.password)

    return user
  },

  async removeUser (_, user) {
    await SocketActions.accessDeleteUser(user.username)

    return user
  },

  async onUserCreated ({ commit }, user) {
    commit('setAddUser', user)
  },

  async onUserDeleted ({ commit }, user) {
    commit('setRemoveUser', user)
  },

  async refreshApiKey ({ commit }) {
    const key = await SocketActions.accessPostApiKey()

    commit('setApiKey', key)
  }
} satisfies ActionTree<AuthState, RootState>
