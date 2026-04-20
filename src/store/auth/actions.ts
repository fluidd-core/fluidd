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
  async initAuth ({ commit, rootGetters }) {
    const keys = rootGetters['config/getTokenKeys']
    const refreshToken = localStorage.getItem(keys['refresh-token'])
    const token = localStorage.getItem(keys['user-token'])
    if (token && refreshToken) {
      commit('setToken', token)
      commit('setRefreshToken', refreshToken)
    }
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

  async login ({ commit, dispatch, rootGetters }, { username, password, source }) {
    const keys = rootGetters['config/getTokenKeys']

    let user: Moonraker.Authorization.LoginResponse
    try {
      user = await SocketActions.accessLogin(username, password, source)
    } catch (error: unknown) {
      // Unsuccessful login. Remove any existing keys and propagate the error.
      localStorage.removeItem(keys['user-token'])
      localStorage.removeItem(keys['refresh-token'])
      throw error
    }

    // Successful login. Moonraker has authenticated the current socket as
    // this user; store the tokens and hand off to the socket state machine,
    // which will re-identify (reading the fresh token from localStorage) and
    // run the post-auth bootstrap on the transition to `ready`.
    localStorage.setItem(keys['user-token'], user.token)
    localStorage.setItem(keys['refresh-token'], user.refresh_token)
    commit('setCurrentUser', {
      username: user.username,
      source: user.source
    })
    commit('setToken', user.token)
    commit('setRefreshToken', user.refresh_token)

    await dispatch('socket/onSetStatus', 'identifying', { root: true })

    return user
  },

  /**
   * Logout the user. Removes their tokens and clears the in-memory auth state.
   * For a full logout, also transitions the socket to `authenticating` so the
   * router guard redirects the user to /login. The websocket connection is
   * intentionally kept open so the login view can call access.info /
   * access.login over it.
   */
  async logout ({ commit, dispatch, rootGetters, rootState }, options?: { invalidate?: boolean; partial?: boolean }) {
    const opts = {
      invalidate: false,
      partial: false,
      ...options
    }

    // Invalidate all sessions (server-side). The current socket session becomes
    // anonymous; Moonraker does not close the connection.
    if (opts.invalidate) {
      try {
        await SocketActions.accessLogout()
      } catch (e) {
        consola.debug('accessLogout failed', e)
      }
    }

    const keys = rootGetters['config/getTokenKeys']
    localStorage.removeItem(keys['user-token'])
    localStorage.removeItem(keys['refresh-token'])

    commit('setCurrentUser', null)
    commit('setToken', null)
    commit('setRefreshToken', null)

    // Full logout: show the login form. Partial logouts are used for trusted
    // clients so they remain signed in after clearing their user tokens.
    if (!opts.partial) {
      const status = rootState.socket.status
      if (status === 'ready' || status === 'identifying') {
        await dispatch('socket/onSetStatus', 'authenticating', { root: true })
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
