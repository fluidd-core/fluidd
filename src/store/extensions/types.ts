export interface ExtensionsState {
  agents: Moonraker.Extensions.AgentInfo[]
}

export interface MoonrakerAgent {
  name: string;
  eventDispatch: string;
  klippyDispatch?: string;
}
