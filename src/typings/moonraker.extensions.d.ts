declare namespace Moonraker.Extensions {
  export interface ListResponse {
    agents: AgentInfo[];
  }

  export interface AgentInfo {
    name: string;
    version: string;
    type: 'agent';
    url: string;
  }

  export type AgentEvent = AgentConnectedEvent | AgentDisconnectedEvent | AgentCustomEvent

  export interface AgentConnectedEvent {
    agent: string;
    event: 'connected';
    data: AgentInfo;
  }

  export interface AgentDisconnectedEvent {
    agent: string;
    event: 'disconnected';
  }

  export interface AgentCustomEvent {
    agent: string;
    event: string;
    data?: unknown;
  }
}

declare namespace Moonraker {
  export interface Methods {
    'server.extensions.list': {
      params: undefined,
      result: Extensions.ListResponse
    },
    'server.extensions.request': {
      params: {
        agent: string,
        method: string,
        arguments?: unknown[] | object | null
      },
      result: unknown
    }
  }

  export interface Notifications {
    notify_agent_event: [Extensions.AgentEvent]
  }
}
