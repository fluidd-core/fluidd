// @vitest-environment node
import { createServer } from 'node:http'
import { once } from 'node:events'
import { WebSocketServer } from 'ws'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAdapter } from '../adapters'
import type { ForeignKind, ForeignPrinterRecord, ForeignStatus } from '../types'

vi.mock('@/services/muon-cloud/discovery', () => ({
  lanFetch: (url: string, init?: RequestInit) => fetch(url, init)
}))

const servers: Array<() => Promise<void>> = []

afterEach(async () => {
  await Promise.all(servers.splice(0).map(close => close()))
})

async function fakePrinter (kind: ForeignKind) {
  const server = createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json')
    if (request.url === '/server/webcams/list') response.end(JSON.stringify({ result: { webcams: [] } }))
    else if (request.url === '/api/login') response.end(JSON.stringify({ name: 'local', session: 'session' }))
    else if (request.url === '/api/printer') response.end(JSON.stringify({ state: { text: 'Printing', flags: { printing: true } } }))
    else response.end(JSON.stringify({}))
  })
  const sockets = new WebSocketServer({ noServer: true })
  server.on('upgrade', (request, socket, head) => {
    sockets.handleUpgrade(request, socket, head, client => {
      client.on('message', () => {
        if (kind === 'moonraker') {
          client.send(JSON.stringify({
            method: 'notify_status_update',
            params: [{
              print_stats: { state: 'printing', filename: 'part.gcode', print_duration: 20 },
              virtual_sdcard: { progress: 0.25 },
              extruder: { temperature: 210, target: 220 },
              heater_bed: { temperature: 60, target: 60 }
            }]
          }))
        }
      })
      const status = kind === 'octoprint'
        ? { current: { state: { text: 'Printing', flags: { printing: true } }, progress: { completion: 25 } } }
        : kind === 'creality'
          ? { state: 1, printProgress: 25, printFileName: 'part.gcode' }
          : { MainboardID: 'mainboard', Status: { PrintInfo: { Status: 13, Progress: 25, Filename: 'part.gcode' } } }
      if (kind !== 'moonraker') client.send(JSON.stringify(status))
    })
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Fake printer did not bind')
  const port = address.port
  class LocalWebSocket extends globalThis.WebSocket {
    constructor (url: string | URL, protocols?: string | string[]) {
      const original = new URL(String(url))
      super(`ws://127.0.0.1:${port}${original.pathname}`, protocols)
    }
  }
  servers.push(async () => {
    for (const client of sockets.clients) client.close()
    await new Promise<void>(resolve => sockets.close(() => resolve()))
    await new Promise<void>(resolve => server.close(() => resolve()))
  })
  return { host: `127.0.0.1:${port}`, WebSocket: LocalWebSocket }
}

const recordFor = (kind: ForeignKind, host: string): ForeignPrinterRecord => ({
  id: kind,
  kind,
  name: kind,
  host,
  via: 'direct',
  formFactor: 'bed-slinger',
  credentialsRef: null,
  addedAt: Date.now()
})

describe('foreign adapters against local HTTP and WebSocket printers', () => {
  it.each(['moonraker', 'octoprint', 'creality', 'elegoo-cc'] as const)('reads %s status', async kind => {
    const fixture = await fakePrinter(kind)
    const adapter = createAdapter(recordFor(kind, fixture.host), null, {
      fetch,
      WebSocket: fixture.WebSocket as unknown as typeof globalThis.WebSocket
    })
    let latest: ForeignStatus = adapter.status
    adapter.onStatus(status => { latest = status })
    try {
      await adapter.connect()
      const deadline = Date.now() + 2000
      while (latest.state !== 'printing' && Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      expect(latest.state).toBe('printing')
    } finally {
      adapter.close()
    }
  })

  it('does not create direct adapters for bridge-only brands', () => {
    expect(() => createAdapter(recordFor('bambu', '192.168.1.9'), null)).toThrow('requires an M1 bridge')
  })
})
