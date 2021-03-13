import Vue from 'vue'
import { MutationTree } from 'vuex'
import { defaultState } from './'
import { ServerState } from './types'

export const mutations: MutationTree<ServerState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setServerInfo (state, payload) {
    Vue.set(state, 'info', payload)
  },

  /**
   * On initial init we get the server (moonraker) configuration.
   */
  setServerConfig (state, payload) {
    state.config = { ...state.config, ...payload }
  },

  /**
   * Sets how many times we've retried connecting to klippy.
   */
  setKlippyRetries (state, payload: number) {
    state.klippy_retries = payload
  }
}
