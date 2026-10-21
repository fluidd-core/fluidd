import type { ActionTree } from 'vuex'
import type { ExtensionsState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'
import { consola } from 'consola'

const isAgentConnectedEvent = (event: Moonraker.Extensions.AgentEvent): event is Moonraker.Extensions.AgentConnectedEvent => (
  event.event === 'connected'
)

const isAgentDisconnectedEvent = (event: Moonraker.Extensions.AgentEvent): event is Moonraker.Extensions.AgentDisconnectedEvent => (
  event.event === 'disconnected'
)

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
  async init () {
    SocketActions.serverExtensionsList()
  },

  async onExtensionsList ({ commit }, payload: Moonraker.Extensions.ListResponse) {
    if (payload) {
      commit('setAgents', payload.agents)
    }
  },

  async onAgentEvent ({ commit, dispatch }, payload: Moonraker.Extensions.AgentEvent) {
    if (isAgentConnectedEvent(payload)) {
      commit('setAgentConnected', payload.data)
    } else if (isAgentDisconnectedEvent(payload)) {
      commit('setAgentDisconnected', payload.agent)
    } else {
      const agent = Object.values<{ name: string, eventDispatch: string }>(Globals.MOONRAKER_AGENTS)
        .find(agent => agent.name === payload.agent)

      if (agent) {
        await dispatch(agent.eventDispatch, payload, { root: true })
      } else {
        consola.debug('[Extensions] unhandled agent event', payload)
      }
    }
  }
} satisfies ActionTree<ExtensionsState, RootState>
