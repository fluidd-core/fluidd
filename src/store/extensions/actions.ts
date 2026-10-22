import type { ActionTree, Dispatch } from 'vuex'
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

const findAgent = (name: string) => Object.values<{ name: string, eventDispatch: string }>(Globals.MOONRAKER_AGENTS)
  .find(agent => agent.name === name)

const dispatchAgentEvent = (dispatch: Dispatch, event: Moonraker.Extensions.AgentEvent) => {
  const agent = findAgent(event.agent)

  return agent
    ? dispatch(agent.eventDispatch, event, { root: true })
    : undefined
}

export const actions = {
  /**
   * Reset our store
   */
  async reset ({ commit, dispatch, state }) {
    // Synthesized: Moonraker can't tell us once the socket is gone
    const promises = state.agents
      .map(info => dispatchAgentEvent(dispatch, {
        agent: info.name,
        event: 'disconnected'
      }))

    commit('setReset')

    await Promise.all(promises)
  },

  /**
   * Inits moonraker component
   */
  async init () {
    SocketActions.serverExtensionsList()
  },

  async onExtensionsList ({ commit, dispatch }, payload: Moonraker.Extensions.ListResponse) {
    if (payload) {
      commit('setAgents', payload.agents)

      // Synthesized: these connected before we were listening
      const promises = payload.agents
        .map(info => dispatchAgentEvent(dispatch, {
          agent: info.name,
          event: 'connected',
          data: info
        }))

      await Promise.all(promises)
    }
  },

  async onAgentEvent ({ commit, dispatch }, payload: Moonraker.Extensions.AgentEvent) {
    let reserved = true

    if (isAgentConnectedEvent(payload)) {
      commit('setAgentConnected', payload.data)
    } else if (isAgentDisconnectedEvent(payload)) {
      commit('setAgentDisconnected', payload.agent)
    } else {
      reserved = false
    }

    const promise = dispatchAgentEvent(dispatch, payload)

    if (promise) {
      await promise
    } else if (!reserved) {
      consola.debug('[Extensions] unhandled agent event', payload)
    }
  }
} satisfies ActionTree<ExtensionsState, RootState>
