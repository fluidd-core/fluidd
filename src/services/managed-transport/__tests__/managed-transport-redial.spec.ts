import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ManagedIrohPrinterTransport } from '../index'
import type { AuthorizedManagedRelaySession, ManagedIrohRelay } from '../index'

function session (id: string): AuthorizedManagedRelaySession {
  return {
    contractVersion: 'managed-iroh/v1',
    sessionId: id,
    tenantId: 'tenant-muon',
    printerId: 'printer-17',
    relayUrl: 'https://relay.example.test',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  }
}

/** A relay whose requests fail once its connection is "lost". */
function relay (name: string, log: string[]) {
  let lost = false
  const r: ManagedIrohRelay & { lose: () => void } = {
    fetch: async () => {
      if (lost) throw new Error('connection lost')
      log.push(`${name}:fetch`)
      return new Response(null, { status: 204 })
    },
    openWebSocket: async () => { throw new Error('not used') },
    close: () => log.push(`${name}:close`),
    lose: () => { lost = true }
  }
  return r
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ManagedIrohPrinterTransport re-dialling', () => {
  it('never redials a shared transport after its owner closes it', async () => {
    const log: string[] = []
    const openRelay = vi.fn(async () => relay('shared', log))
    const transport = new ManagedIrohPrinterTransport({ authorizedSession: session('grant'), createEndpoint: async () => ({ openRelay, close () {} }) })
    await transport.fetch('/server/info')
    transport.close()
    await expect(transport.fetch('/server/info')).rejects.toThrow(/closed/)
    await expect(transport.openWebSocket('/websocket')).rejects.toThrow(/closed/)
    expect(openRelay).toHaveBeenCalledTimes(1)
    expect(transport.status.connection).toBe('closed')
  })
  it('keeps the shared connection when one HTTP caller cancels its request', async () => {
    const log: string[] = []
    const shared = relay('shared', log)
    const originalFetch = shared.fetch
    shared.fetch = async (path, init) => {
      if (init?.signal?.aborted) throw init.signal.reason
      return originalFetch(path, init)
    }
    const openRelay = vi.fn(async () => shared)
    const transport = new ManagedIrohPrinterTransport({ authorizedSession: session('grant'), createEndpoint: async () => ({ openRelay, close () {} }) })
    await transport.fetch('/server/info')
    const cancelled = new AbortController()
    cancelled.abort()
    await expect(transport.fetch('/server/files', { signal: cancelled.signal })).rejects.toMatchObject({ name: 'AbortError' })
    await transport.fetch('/server/info')
    expect(openRelay).toHaveBeenCalledTimes(1)
    expect(log).toEqual(['shared:fetch', 'shared:fetch'])
  })
  it('drops a relay that failed a request, and dials a new one for the next', async () => {
    // Before this, a dead connection was kept for the life of the selection
    // and every request failed until the page was reloaded.
    const log: string[] = []
    const first = relay('first', log)
    const second = relay('second', log)
    const openRelay = vi.fn()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second)
    const transport = new ManagedIrohPrinterTransport({
      authorizedSession: session('grant-1'),
      createEndpoint: async () => ({ openRelay, close: () => {} })
    })

    await transport.fetch('/server/info')
    first.lose()
    await expect(transport.fetch('/server/info')).rejects.toThrow('connection lost')
    await transport.fetch('/server/info')

    expect(openRelay).toHaveBeenCalledTimes(2)
    expect(log).toEqual(['first:fetch', 'first:close', 'second:fetch'])
  })

  it('waits longer after each failed dial, and asks for a new handoff after two', async () => {
    const log: string[] = []
    const sessions: string[] = []
    const openRelay = vi.fn(async (s: AuthorizedManagedRelaySession) => {
      sessions.push(s.sessionId)
      if (s.sessionId === 'grant-1') throw new Error('refused')
      return relay('fresh', log)
    })
    const reauthorize = vi.fn(async () => session('grant-2'))
    const transport = new ManagedIrohPrinterTransport({
      authorizedSession: session('grant-1'),
      createEndpoint: async () => ({ openRelay, close: () => {} }),
      reauthorize
    })

    await expect(transport.fetch('/server/info')).rejects.toThrow('refused')

    // The second dial waits a second before going out.
    const second = transport.fetch('/server/info')
    second.catch(() => {})
    await vi.advanceTimersByTimeAsync(999)
    expect(openRelay).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    await expect(second).rejects.toThrow('refused')
    expect(reauthorize).not.toHaveBeenCalled()

    // Two failures: the third dial asks for a new handoff first, two seconds on.
    const third = transport.fetch('/server/info')
    await vi.advanceTimersByTimeAsync(2000)
    await third

    expect(reauthorize).toHaveBeenCalledTimes(1)
    expect(sessions).toEqual(['grant-1', 'grant-1', 'grant-2'])
    expect(log).toEqual(['fresh:fetch'])
  })
})
