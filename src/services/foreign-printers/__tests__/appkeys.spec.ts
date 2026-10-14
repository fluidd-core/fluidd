// @vitest-environment node
import { createServer } from 'node:http'
import { once } from 'node:events'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestOctoPrintKey } from '../appkeys'

const servers: Array<() => Promise<void>> = []

async function appKeyServer (polls: number[], probeStatus = 204) {
  const server = createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json')
    if (request.url === '/plugin/appkeys/probe') {
      response.writeHead(probeStatus).end()
    } else if (request.method === 'POST') {
      response.writeHead(201).end(JSON.stringify({ app_token: 'token' }))
    } else {
      const status = polls.shift() ?? 202
      response.writeHead(status).end(status === 200 ? JSON.stringify({ api_key: 'key' }) : '')
    }
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Server did not bind')
  servers.push(() => new Promise(resolve => server.close(() => resolve())))
  return `127.0.0.1:${address.port}`
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map(close => close()))
})

describe('requestOctoPrintKey', () => {
  it('polls approval and returns the key', async () => {
    const host = await appKeyServer([202, 200])
    const onPending = vi.fn()
    await expect(requestOctoPrintKey(host, { fetch }, { onPending, intervalMs: 0 })).resolves.toBe('key')
    expect(onPending).toHaveBeenCalledOnce()
  })

  it('rejects a denied poll', async () => {
    const host = await appKeyServer([404])
    await expect(requestOctoPrintKey(host, { fetch }, { intervalMs: 0 })).rejects.toThrow('denied')
  })

  it('returns null when the probe is not supported', async () => {
    const host = await appKeyServer([], 404)
    await expect(requestOctoPrintKey(host, { fetch })).resolves.toBeNull()
  })

  it('rejects when polling times out', async () => {
    const host = await appKeyServer([202, 202])
    await expect(requestOctoPrintKey(host, { fetch }, { intervalMs: 0, attempts: 2 })).rejects.toThrow('denied')
  })
})
