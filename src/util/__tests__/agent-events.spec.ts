import { resolveAgentEvent, type AgentRegistration } from '../agent-events'

const agents: AgentRegistration[] = [
  {
    name: 'aldis',
    dispatch: 'firmware/init',
    eventDispatch: 'firmware/onAgentEvent',
    disconnectDispatch: 'firmware/onAgentDisconnected',
    klippyDispatch: 'firmware/onKlippyStateChanged'
  }
]

describe('resolveAgentEvent', () => {
  it('routes connected to the server store with the agent name', () => {
    expect(resolveAgentEvent({ agent: 'aldis', event: 'connected', data: { name: 'aldis' } }, agents))
      .toEqual({ action: 'server/onAgentConnected', payload: 'aldis' })
  })

  it('routes disconnected to the server store with the agent name', () => {
    expect(resolveAgentEvent({ agent: 'aldis', event: 'disconnected' }, agents))
      .toEqual({ action: 'server/onAgentDisconnected', payload: 'aldis' })
  })

  it('routes connected for an unregistered agent too', () => {
    expect(resolveAgentEvent({ agent: 'other', event: 'connected' }, agents))
      .toEqual({ action: 'server/onAgentConnected', payload: 'other' })
  })

  it('routes a registered agent event with the whole envelope', () => {
    const event = { agent: 'aldis', event: 'update_response', data: { run_id: 'r1' } }

    expect(resolveAgentEvent(event, agents))
      .toEqual({ action: 'firmware/onAgentEvent', payload: event })
  })

  it('drops events from unknown agents', () => {
    expect(resolveAgentEvent({ agent: 'other', event: 'anything' }, agents)).toBeNull()
  })
})
