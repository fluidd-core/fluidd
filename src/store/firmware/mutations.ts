import type { MutationTree } from 'vuex'
import type { FirmwareState } from './types'
import { createState } from './state'

export const mutations = {
  setReset (state) {
    // Kept: the agent still reports the dismissed run after a reconnect
    const { dismissedRunId } = state

    Object.assign(state, {
      ...createState(),
      dismissedRunId
    })
  },

  setInitialised (state, payload: boolean) {
    state.initialised = payload
  },

  setStatus (state, payload: Aldis.StatusResponse | null) {
    state.status = payload
  },

  setStatusError (state, payload: string | null) {
    state.statusError = payload
  },

  setRefreshing (state, payload: boolean) {
    state.refreshing = payload
  },

  setRun (state, payload: Aldis.Run | null) {
    if (
      payload?.state === 'running' &&
      payload.run_id !== state.run?.run_id
    ) {
      state.pending = false
      state.logRunId = payload.run_id
    }

    state.run = payload
  },

  setPending (state, payload: boolean) {
    state.pending = payload
  },

  setRunStarted (state, payload: string) {
    if (state.run?.run_id !== payload) {
      state.run = {
        run_id: payload,
        state: 'running',
        messages: [],
        result: null
      }
      state.logRunId = payload
    }

    state.pending = false
  },

  setRetried (state, payload: boolean) {
    state.retried = payload
  },

  setUpdateStarted (state) {
    state.pending = true
    state.logRunId = null
    state.retried = false
  },

  setClearResponses (state) {
    state.logRunId = null
  },

  setClearLastResult (state) {
    state.dismissedRunId = state.run?.run_id ?? null
  }
} satisfies MutationTree<FirmwareState>
