import type { ActionTree } from 'vuex'
import type { ExtensionsState, MoonrakerAgent } from './types'
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

const registeredAgents = (): MoonrakerAgent[] => Object.values<MoonrakerAgent>(Globals.MOONRAKER_AGENTS)

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

  async refresh () {
    await SocketActions.serverExtensionsList({ suppressError: true })
      .catch(() => undefined)
  },

  async initAgents ({ state, dispatch }) {
    const promises = registeredAgents()
      .filter(agent => state.agents.some(connected => connected.name === agent.name))
      .map(agent => dispatch(agent.dispatch, undefined, { root: true }))

    await Promise.all(promises)
  },

  async onExtensionsList ({ commit, dispatch }, payload: Moonraker.Extensions.ListResponse) {
    if (payload) {
      commit('setAgents', payload.agents)

      await dispatch('initAgents')
    }
  },

  async onKlippyStateChanged ({ state, dispatch }) {
    const promises = registeredAgents()
      .filter(agent => state.agents.some(connected => connected.name === agent.name))
      .map(agent => agent.klippyDispatch
        ? dispatch(agent.klippyDispatch, undefined, { root: true })
        : null)

    await Promise.all(promises)
  },

  async onAgentEvent ({ commit, dispatch }, payload: Moonraker.Extensions.AgentEvent) {
    let reserved = true

    const agent = registeredAgents()
      .find(agent => agent.name === payload.agent)

    if (isAgentConnectedEvent(payload)) {
      commit('setAgentConnected', payload.data)

      await dispatch('initAgents')
    } else if (isAgentDisconnectedEvent(payload)) {
      commit('setAgentDisconnected', payload.agent)

      if (agent?.disconnectDispatch) {
        await dispatch(agent.disconnectDispatch, undefined, { root: true })
      }
    } else {
      reserved = false
    }

    if (agent) {
      await dispatch(agent.eventDispatch, payload, { root: true })
    } else if (!reserved) {
      consola.debug('[Extensions] unhandled agent event', payload)
    }
  }
} satisfies ActionTree<ExtensionsState, RootState>
