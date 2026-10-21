import Vue from 'vue'
import type { MutationTree } from 'vuex'
import { createState } from './state'
import type { ExtensionsState } from './types'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, createState())
  },

  setAgents (state, payload: Moonraker.Extensions.AgentInfo[]) {
    state.agents = payload
  },

  setAgentConnected (state, payload: Moonraker.Extensions.AgentInfo) {
    const index = state.agents
      .findIndex(agent => agent.name === payload.name)

    if (index >= 0) {
      Vue.set(state.agents, index, payload)
    } else {
      state.agents.push(payload)
    }
  },

  setAgentDisconnected (state, payload: string) {
    const index = state.agents
      .findIndex(agent => agent.name === payload)

    if (index >= 0) {
      state.agents.splice(index, 1)
    }
  }
} satisfies MutationTree<ExtensionsState>
