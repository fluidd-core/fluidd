import type { MutationTree } from 'vuex'
import type { FirmwareRunState, FirmwareState } from './types'
import { createState } from './state'

export const mutations = {
  setReset (state) {
    Object.assign(state, createState())
  },

  setInitialised (state, payload: boolean) {
    state.initialised = payload
  },

  setStatus (state, payload: Aldis.StatusResponse) {
    state.status = payload
  },

  setStatusError (state, payload: string | null) {
    state.statusError = payload
  },

  setRunState (state, payload: FirmwareRunState) {
    state.busy = payload.busy
    state.runId = payload.runId
    state.responses = payload.responses
    state.lastResult = payload.lastResult
    state.lastMessage = payload.lastMessage
    state.resultRunId = payload.resultRunId
    state.dismissedRunId = payload.dismissedRunId
  },

  setBusy (state, payload: boolean) {
    state.busy = payload
  },

  setRunId (state, payload: string) {
    if (state.runId === null) {
      state.runId = payload
    }
  },

  setRetried (state, payload: boolean) {
    state.retried = payload
  },

  setUpdateStarted (state) {
    state.busy = true
    state.runId = null
    state.responses = []
    state.lastResult = null
    state.lastMessage = null
    state.resultRunId = null
    state.dismissedRunId = null
    state.retried = false
  },

  setClearResponses (state) {
    state.responses = []
  },

  setClearLastResult (state) {
    state.dismissedRunId = state.resultRunId
    state.lastResult = null
    state.lastMessage = null
    state.resultRunId = null
  }
} satisfies MutationTree<FirmwareState>
