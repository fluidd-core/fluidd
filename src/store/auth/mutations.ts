import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { AppUser, AuthState } from './types'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setCurrentUser (state, user: AppUser | null) {
    state.currentUser = user
  },

  setUsers (state, users: AppUser[]) {
    state.users = users
  },

  setAddUser (state, user: { username: string; source?: string }) {
    state.users.push({ source: 'moonraker', ...user })
  },

  setRemoveUser (state, user: { username: string }) {
    const i = state.users.findIndex(u => u.username === user.username)
    if (i >= 0) state.users.splice(i, 1)
  },

  setApiKey (state, key: string) {
    state.apiKey = key
  }
} satisfies MutationTree<AuthState>
