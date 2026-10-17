export interface AgentRegistration {
  name: string;
  dispatch: string;
  eventDispatch: string;
  disconnectDispatch?: string;
  klippyDispatch?: string;
}

export interface AgentEventTarget {
  action: string;
  payload: unknown;
}

export const resolveAgentEvent = (
  event: Moonraker.Server.AgentEvent,
  agents: readonly AgentRegistration[]
): AgentEventTarget | null => {
  if (event.event === 'connected') {
    return { action: 'server/onAgentConnected', payload: event.agent }
  }

  if (event.event === 'disconnected') {
    return { action: 'server/onAgentDisconnected', payload: event.agent }
  }

  const agent = agents.find(agent => agent.name === event.agent)

  return agent
    ? { action: agent.eventDispatch, payload: event }
    : null
}
