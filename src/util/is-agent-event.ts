export const isAgentConnectedEvent = (event: Moonraker.Extensions.AgentEvent): event is Moonraker.Extensions.AgentConnectedEvent => (
  event.event === 'connected'
)

export const isAgentDisconnectedEvent = (event: Moonraker.Extensions.AgentEvent): event is Moonraker.Extensions.AgentDisconnectedEvent => (
  event.event === 'disconnected'
)
