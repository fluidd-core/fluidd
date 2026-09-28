declare namespace Moonraker.Websocket {
  export interface ConnectionIdentifyResponse {
    connection_id: number;
  }

  export interface ConnectionIdentifyParams {
    client_name: string;
    version: string;
    type: ClientType;
    url: string;
    access_token?: string;
    api_key?: string;
  }

  export type ClientType = 'web' | 'mobile' | 'desktop' | 'display' | 'bot' | 'agent' | 'other'
}

declare namespace Moonraker {
  export interface Methods {
    'server.connection.identify': {
      params: Websocket.ConnectionIdentifyParams,
      result: Websocket.ConnectionIdentifyResponse
    }
  }
}
