import type { MutationTree } from 'vuex'
import type { SocketState, SocketStatus } from './types'
import { defaultState } from './state'

export const mutations = {
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setStatus (state, payload: SocketStatus) {
    if (state.status !== payload) state.status = payload
  },

  setAcceptNotifications (state, payload: boolean) {
    state.acceptingNotifications = payload
  },

  setConnectionId (state, payload: number | null) {
    state.connectionId = payload
  }
} satisfies MutationTree<SocketState>
