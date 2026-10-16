declare namespace Moonraker.Websocket {
  export interface ConnectionIdentifyResponse {
    connection_id: number;
  }

  export type ClientType = 'web' | 'mobile' | 'desktop' | 'display' | 'bot' | 'agent' | 'other'
}

declare namespace Moonraker {
  export interface Methods {
    'server.connection.identify': {
      params: {
        client_name: string,
        version: string,
        type: Websocket.ClientType,
        url: string,
        access_token?: string,
        api_key?: string
      },
      result: Websocket.ConnectionIdentifyResponse
    }
  }
}
