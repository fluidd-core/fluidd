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
    state.agents = [
      ...state.agents.filter(agent => agent.name !== payload.name),
      payload
    ]
  },

  setAgentDisconnected (state, payload: string) {
    state.agents = state.agents.filter(agent => agent.name !== payload)
  }
} satisfies MutationTree<ExtensionsState>
