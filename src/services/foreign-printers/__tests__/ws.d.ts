declare module 'ws' {
  export class WebSocket {
    on (event: string, listener: (...args: any[]) => void): void
    send (data: string): void
    close (): void
  }
  export class WebSocketServer {
    constructor (options: any)
    clients: Set<WebSocket>
    handleUpgrade (request: any, socket: any, head: any, callback: (client: WebSocket) => void): void
    close (callback: () => void): void
  }
}
