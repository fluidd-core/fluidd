export interface ExtensionsState {
  agents: Moonraker.Extensions.AgentInfo[]
}

export interface MoonrakerAgent {
  name: string;
  dispatch: string;
  eventDispatch: string;
  disconnectDispatch?: string;
  klippyDispatch?: string;
}
