import Vue from 'vue'
import { ActionTree } from 'vuex'
import { AuthState } from './types'
import { RootState } from '../types'
import { httpClientActions } from '@/api/httpClientActions'
import router from '@/router'
import consola from 'consola'

export const actions: ActionTree<AuthState, RootState> = {
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
    // Load current user.
    await httpClientActions.accessCurrentUserGet()
      .then(response => response.data.result)
      .then((user) => commit('setCurrentUser', user))

    // Load user list.
    await httpClientActions.accessUsersListGet()
      .then(response => response.data.result.users)
      .then((users) => commit('setUsers', users))

    // Load our current API key.
    await httpClientActions.accessApiKeyGet()
      .then(response => response.data.result)
      .then((key) => commit('setApiKey', key))
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
      // We have tokens, commit to them to memory and setup the axios auth
      // header.
      commit('setToken', token)
      commit('setRefreshToken', refreshToken)
      httpClientActions.defaults.headers.common.Authorization = `Bearer ${token}`
    } else {
      // No tokens, delete auth header.
      delete httpClientActions.defaults.headers.common.Authorization
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
        // console.debug('checkToken - not isExpiring', new Date(now * 1000), new Date(exp * 1000))
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
    return httpClientActions.accessRefreshJwtPost(refresh_token || '', {
      withAuth: false
    })
      .then(response => response.data.result)
      .then((response) => {
        // We've successfully retrieved a token. Set the new header and
        // store data, and move on.
        localStorage.setItem(keys['user-token'], response.token)
        commit('setToken', response.token)
        httpClientActions.defaults.headers.common.Authorization = `Bearer ${response.token}`
        return Promise.resolve(response.token)
      })
      .catch(() => {
        // Error on refresh, we resolve and move on because our request will
        // invoke a 401, which will then send the user to the login page.
        return Promise.resolve()
      })
  },

  async getAuthInfo () {
    return httpClientActions.accessInfoGet({ withAuth: false })
      .then(r => {
        return {
          defaultSource: r.data.result.default_source,
          availableSources: r.data.result.available_sources
        }
      }).catch(() => {
        // external authentication sources not supported
        return {}
      })
  },

  async login ({ commit, rootGetters }, { username, password, source }) {
    const keys = rootGetters['config/getTokenKeys']
    return httpClientActions.accessLoginPost(username, password, source)
      .then(response => response.data.result)
      .then(user => {
        // Successful login. Set the tokens and auth status and move on.
        localStorage.setItem(keys['user-token'], user.token)
        localStorage.setItem(keys['refresh-token'], user.refresh_token)
        httpClientActions.defaults.headers.common.Authorization = `Bearer ${user.token}`
        commit('setAuthenticated', true)
        commit('setCurrentUser', {
          username: user.username,
          source: user.source
        })
        commit('setToken', user.token)
        commit('setRefreshToken', user.refresh_token)
        return Promise.resolve(user)
      })
      .catch(err => {
        // Unsuccessful login. Remove any existing keys, set auth and move on.
        localStorage.removeItem(keys['user-token'])
        localStorage.removeItem(keys['refresh-token'])
        delete httpClientActions.defaults.headers.common.Authorization
        return Promise.reject(err)
      })
  },

  /**
   * Logout the user. This should remove their token from local storage,
   * shut down the socket and send them back to the login page.
   */
  async logout ({ commit, rootGetters }, options?: { invalidate: boolean; partial: boolean }) {
    const opts = {
      ...{
        invalidate: false,
        partial: false
      },
      ...options
    }

    const keys = rootGetters['config/getTokenKeys']

    // Do we want to invalidate all sessions?
    if (opts.invalidate) await httpClientActions.accessLogoutPost()

    // Remove the tokens from local storage..
    localStorage.removeItem(keys['user-token'])
    localStorage.removeItem(keys['refresh-token'])

    // Remove the authentication header.
    delete httpClientActions.defaults.headers.common.Authorization

    // Clear the in memory store.
    commit('setCurrentUser', null)
    commit('setToken', null)
    commit('setRefreshToken', null)

    // If not a partial logout, then close the socket and set unauthenticated.
    // Partial logouts are used for trusted clients, in that they remain
    // authenticated (and socket remains open) when logging out.
    if (!opts.partial) {
      if (Vue.$socket) Vue.$socket.close()
      commit('setAuthenticated', false)
      if (router.currentRoute.path !== '/login') router.push('/login')
    }
  },

  /**
   * Checks the current users trust, with no token. This acts as a logout
   * and / or trust check, in that if the user is not trusted - then we log
   * them out which bumps them to the login page.
   */
  async checkTrust ({ dispatch, commit, rootGetters }) {
    const keys = rootGetters['config/getTokenKeys']
    const token = localStorage.getItem(keys['user-token'])

    // Clear the token.
    delete httpClientActions.defaults.headers.common.Authorization

    // Make the request.
    await httpClientActions.accessCurrentUserGet({ withAuth: false })
      .then(response => response.data.result)
      .then((user) => {
        // Re-apply the token.
        httpClientActions.defaults.headers.common.Authorization = `Bearer ${token}`

        // no error, so must be trusted. partial logout.
        dispatch('logout', { partial: true })
        commit('setCurrentUser', user)
      })
      .catch(() => {
        // error. not trusted. log'em out.
        dispatch('logout')
      })
  },

  async addUser (_, user) {
    return httpClientActions.accessUserPost(user.username, user.password)
      .then(() => {
        return Promise.resolve(user)
      })
  },

  async removeUser (_, user) {
    return httpClientActions.accessUserDelete(user.username)
      .then(() => {
        return Promise.resolve(user)
      })
  },

  async onUserCreated ({ commit }, user) {
    commit('setAddUser', user)
  },

  async onUserDeleted ({ commit }, user) {
    commit('setRemoveUser', user)
  },

  async refreshApiKey ({ commit }) {
    return httpClientActions.accessApiKeyPost()
      .then(response => response.data.result)
      .then(key => commit('setApiKey', key))
  }
}
