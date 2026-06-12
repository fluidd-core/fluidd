import type { ActionTree } from 'vuex'
import type { AuthState } from './types'
import type { RootState } from '../types'
import { consola } from 'consola'
import { SocketActions } from '@/api/socketActions'
import type { TokenKeys } from '../config/types'

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

  async login ({ commit, dispatch, rootGetters }, { username, password, source }) {
    const user = await SocketActions.accessLogin(username, password, source)

    // Successful login. Moonraker has authenticated the current socket as
    // this user; store the tokens and hand off to the socket state machine,
    // which will re-identify (reading the fresh token from localStorage) and
    // run the post-auth bootstrap on the transition to `ready`.
    const keys: TokenKeys = rootGetters['config/getTokenKeys']
    localStorage.setItem(keys.userToken, user.token)
    localStorage.setItem(keys.refreshToken, user.refresh_token)
    commit('setCurrentUser', {
      username: user.username,
      source: user.source
    })

    await dispatch('socket/onSetStatus', 'identifying', { root: true })

    return user
  },

  /**
   * Logout the user. Removes their tokens and clears the in-memory auth state.
   * For a full logout, also transitions the socket to `authenticating` so
   * App.vue renders the login overlay. The websocket connection is intentionally
   * kept open so the login overlay can call access.info / access.login over it.
   */
  async logout ({ commit, dispatch, rootGetters, rootState }, payload: { invalidate?: boolean; partial?: boolean } = {}) {
    const { invalidate = false, partial = false } = payload

    // Invalidate all sessions (server-side). The current socket session becomes
    // anonymous; Moonraker does not close the connection.
    if (invalidate) {
      try {
        await SocketActions.accessLogout()
      } catch (e) {
        consola.debug('accessLogout failed', e)
      }
    }

    const keys: TokenKeys = rootGetters['config/getTokenKeys']
    localStorage.removeItem(keys.userToken)
    localStorage.removeItem(keys.refreshToken)

    commit('setCurrentUser', null)

    // Full logout: show the login form. Partial logouts are used for trusted
    // clients so they remain signed in after clearing their user tokens.
    if (!partial) {
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
   * shows the login overlay. login_required overrides trusted_clients whenever
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

  async onUserCreated ({ commit }, user: { username: string }) {
    commit('setAddUser', user)
  },

  async onUserDeleted ({ commit }, user: { username: string }) {
    commit('setRemoveUser', user)
  },

  async refreshApiKey ({ commit }) {
    const key = await SocketActions.accessPostApiKey()

    commit('setApiKey', key)
  }
} satisfies ActionTree<AuthState, RootState>
