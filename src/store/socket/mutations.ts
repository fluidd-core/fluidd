import type { MutationTree } from 'vuex'
import type { SocketState, SocketStatus } from './types'
import { createState } from './state'

export const mutations = {
  setReset (state) {
    Object.assign(state, createState())
  },

  setStatus (state, payload: SocketStatus) {
    if (state.status !== payload) state.status = payload
  },

  setAcceptNotifications (state, payload: boolean) {
    state.acceptingNotifications = payload
  },

  setConnectionId (state, payload: number | null) {
    state.connectionId = payload
  },

  setRetryAt (state, payload: number | null) {
    state.retryAt = payload
  },

  setStalled (state, payload: boolean) {
    state.stalled = payload
  }
} satisfies MutationTree<SocketState>
