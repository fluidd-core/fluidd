import type { MutationTree } from 'vuex'
import { createState } from './state'
import type { SocketRetry, SocketState, SocketStatus } from './types'

export const mutations = {
  setReset(state) {
    Object.assign(state, createState())
  },

  setStatus(state, payload: SocketStatus) {
    if (state.status !== payload) state.status = payload
  },

  setAcceptNotifications(state, payload: boolean) {
    state.acceptingNotifications = payload
  },

  setConnectionId(state, payload: number | null) {
    state.connectionId = payload
  },

  setRetry(state, payload: SocketRetry | null) {
    state.retry = payload
  },

  setStalled(state, payload: boolean) {
    state.stalled = payload
  }
} satisfies MutationTree<SocketState>
