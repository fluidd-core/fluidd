import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { createSetupClient, SetupHttpError, type SetupClient } from '../client'
import { setupState } from '../state'
import type { SetupState } from '../types'
import networkPhone from './fixtures/state.02-network-phone-driver.json'
import joiningState from './fixtures/state.04-joining.json'
import linkCode from './fixtures/state.06-remote-link-code.json'
import staleRev from './fixtures/result.stale-rev.json'

const PHONE = '5b1f0c7e-9f7a-4f5e-8f0a-2d6f3c1a9b10'
const ORIGIN = 'http://muon-walnut-8987.local'

const copy = (fixture: unknown): SetupState => JSON.parse(JSON.stringify(fixture))

class FakeSocket {
  static all: FakeSocket[] = []
  onopen: ((e: unknown) => void) | null = null
  onclose: ((e: unknown) => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  onmessage: ((e: { data: string }) => void) | null = null
  sent: Array<Record<string, any>> = []
  closed = false
  readonly url: string

  constructor (url: string) {
    this.url = url
    FakeSocket.all.push(this)
  }

  static get last () { return FakeSocket.all[FakeSocket.all.length - 1] }

  send (data: string) { this.sent.push(JSON.parse(data)) }
  close () {
    if (this.closed) return
    this.closed = true
    this.onclose?.({})
  }

  open () { this.onopen?.({}) }
  drop () { this.close() }
  notify (state: SetupState) {
    this.onmessage?.({ data: JSON.stringify({ jsonrpc: '2.0', method: 'notify_muon_setup_changed', params: [state] }) })
  }
}

/** A document whose visibility a test can change. */
const fakeDoc = () => {
  const listeners = new Set<() => void>()
  return {
    visibilityState: 'visible' as DocumentVisibilityState,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    setVisible (visible: boolean) {
      this.visibilityState = visible ? 'visible' : 'hidden'
      listeners.forEach(fn => fn())
    }
  }
}

type Route = (init: RequestInit) => Promise<Response> | Response

const bodyOf = (init?: RequestInit) => JSON.parse(String(init?.body))

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json' }
})

describe('setup client', () => {
  let routes: Record<string, Route>
  let fetchImpl: Mock<[url: string, init?: RequestInit], Promise<Response>>
  let doc: ReturnType<typeof fakeDoc>
  let client: SetupClient

  const calls = (path: string, method = 'GET') => fetchImpl.mock.calls
    .filter(([url, init]) => String(url).replace(ORIGIN, '').split('?')[0] === path && (init?.method ?? 'GET') === method)

  const make = (origin = ORIGIN) => {
    client = createSetupClient({
      origin,
      href: `${origin}/setup`,
      WebSocketImpl: FakeSocket as unknown as typeof WebSocket,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      doc: doc as unknown as Document,
      version: '1.0.0'
    })
    return client
  }

  beforeEach(() => {
    vi.useFakeTimers()
    FakeSocket.all = []
    setupState.state = null
    setupState.lostWrite = null
    setupState.local.clientId = PHONE
    doc = fakeDoc()
    routes = {
      'GET /server/muon/setup': () => json({ result: copy(networkPhone) }),
      'GET /access/oneshot_token': () => json({ result: 'one-shot' })
    }
    fetchImpl = vi.fn(async (url: string, init: RequestInit = {}): Promise<Response> => {
      const key = `${init.method ?? 'GET'} ${url.replace(ORIGIN, '').replace('http://10.42.0.1', '').split('?')[0]}`
      const route = routes[key]
      if (!route) throw new TypeError(`Failed to fetch ${key}`)
      return route(init)
    })
  })

  afterEach(() => {
    client?.stop()
    vi.useRealTimers()
  })

  it('opens its own socket to the page origin, identifies, and GETs the state', async () => {
    make().start()
    await vi.advanceTimersByTimeAsync(0)

    expect(FakeSocket.last.url).toBe('ws://muon-walnut-8987.local/websocket')
    FakeSocket.last.open()
    expect(FakeSocket.last.sent[0]).toMatchObject({
      method: 'server.connection.identify',
      params: { client_name: 'muon-setup', version: '1.0.0', type: 'web', url: `${ORIGIN}/setup` }
    })
    await vi.advanceTimersByTimeAsync(0)
    expect(setupState.state?.rev).toBe(4)
    expect(setupState.connection).toBe('connected')
    // Every request goes to the page's own origin.
    expect(fetchImpl.mock.calls.every(([url]) => String(url).startsWith(ORIGIN))).toBe(true)
  })

  it('reconnects every second, and GETs the state after each reconnect', async () => {
    make().start()
    await vi.advanceTimersByTimeAsync(0)
    FakeSocket.last.open()
    await vi.advanceTimersByTimeAsync(0)
    const getsBefore = calls('/server/muon/setup').length

    FakeSocket.last.drop()
    expect(setupState.connection).toBe('reconnecting')
    await vi.advanceTimersByTimeAsync(999)
    expect(FakeSocket.all).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(FakeSocket.all).toHaveLength(2)

    // It never opens: another attempt a second later, and one after that.
    FakeSocket.last.drop()
    await vi.advanceTimersByTimeAsync(1000)
    expect(FakeSocket.all).toHaveLength(3)
    FakeSocket.last.drop()
    await vi.advanceTimersByTimeAsync(1000)
    expect(FakeSocket.all).toHaveLength(4)

    FakeSocket.last.open()
    await vi.advanceTimersByTimeAsync(0)
    expect(setupState.connection).toBe('connected')
    expect(calls('/server/muon/setup').length).toBeGreaterThan(getsBefore)
    expect(FakeSocket.last.sent[0].method).toBe('server.connection.identify')
  })

  it('asks for a one-shot token after a socket that never opened', async () => {
    make().start()
    await vi.advanceTimersByTimeAsync(0)
    FakeSocket.last.drop()
    await vi.advanceTimersByTimeAsync(1000)

    expect(calls('/access/oneshot_token')).toHaveLength(1)
    expect(FakeSocket.last.url).toBe('ws://muon-walnut-8987.local/websocket?token=one-shot')
  })

  it('polls the state every 2 s while the socket is down, and stops once it is back', async () => {
    make().start()
    await vi.advanceTimersByTimeAsync(0)
    FakeSocket.last.open()
    await vi.advanceTimersByTimeAsync(0)
    const settled = calls('/server/muon/setup').length

    // Connected: no polling.
    await vi.advanceTimersByTimeAsync(6000)
    expect(calls('/server/muon/setup').length).toBe(settled)

    FakeSocket.last.drop()
    // Keep every reconnect failing, so only polling can bring news.
    const failing = setInterval(() => { if (!FakeSocket.last.closed) FakeSocket.last.drop() }, 100)
    routes['GET /server/muon/setup'] = () => json({ result: copy(joiningState) })
    await vi.advanceTimersByTimeAsync(4000)
    clearInterval(failing)
    expect(calls('/server/muon/setup').length).toBeGreaterThanOrEqual(settled + 2)
    expect(setupState.state?.op?.kind).toBe('join')
  })

  it('treats a write with no answer as lost, not failed, and lets the next state settle it', async () => {
    make().start()
    await vi.advanceTimersByTimeAsync(0)
    FakeSocket.last.open()
    await vi.advanceTimersByTimeAsync(0)

    // The phone drops off the hotspot just as it sends the join, so nothing
    // answers, the follow-up GET included.
    delete routes['GET /server/muon/setup']
    const answer = client.post('network', { kind: 'wifi', ssid: 'HomeWiFi', security: 'wpa2', region: 'GB' })
    await vi.advanceTimersByTimeAsync(0)
    await expect(answer).resolves.toBeNull()
    expect(setupState.lostWrite).toEqual({ step: 'network', failed: false })

    // The printer had it after all: the join is running.
    FakeSocket.last.notify(copy(joiningState))
    expect(setupState.lostWrite).toBeNull()
  })

  it('says a lost write did not arrive when the next state shows the step untouched', async () => {
    make().start()
    await vi.advanceTimersByTimeAsync(0)
    FakeSocket.last.open()
    await vi.advanceTimersByTimeAsync(0)

    routes['POST /server/muon/setup/network'] = (init) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    })
    const answer = client.post('network', { kind: 'wifi', ssid: 'HomeWiFi', security: 'open', region: 'GB' })
    await vi.advanceTimersByTimeAsync(9999)
    expect(setupState.lostWrite).toBeNull()
    await vi.advanceTimersByTimeAsync(1)
    await expect(answer).resolves.toBeNull()

    FakeSocket.last.notify({ ...copy(networkPhone), rev: 5 })
    expect(setupState.lostWrite).toEqual({ step: 'network', failed: true })
  })

  it('sends JSON with the current rev, and takes the state a stale_rev refusal carries', async () => {
    make().start()
    await vi.advanceTimersByTimeAsync(0)
    routes['POST /server/muon/setup/remote'] = () => json({ result: staleRev })

    const result = await client.post('remote', { mode: 'local' })

    const [, init] = calls('/server/muon/setup/remote', 'POST')[0]
    expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    expect(bodyOf(init)).toEqual({ mode: 'local', rev: 4 })
    expect(result?.error?.code).toBe('stale_rev')
    expect(setupState.state?.rev).toBe(12)
  })

  it('reports a refusal from Moonraker itself as an error, not a lost write', async () => {
    make().start()
    await vi.advanceTimersByTimeAsync(0)
    routes['POST /server/muon/setup/name'] = () => json({ error: { code: 415, message: 'muon_setup: JSON only' } }, 415)

    await expect(client.post('name', { name: 'Walnut' })).rejects.toBeInstanceOf(SetupHttpError)
    expect(setupState.lostWrite).toBeNull()
  })

  it('ignores a notification older than the state it holds', async () => {
    make().start()
    await vi.advanceTimersByTimeAsync(0)
    FakeSocket.last.open()
    await vi.advanceTimersByTimeAsync(0)

    FakeSocket.last.notify(copy(linkCode))
    expect(setupState.state?.rev).toBe(12)
    FakeSocket.last.notify(copy(joiningState))
    expect(setupState.state?.rev).toBe(12)
    FakeSocket.last.notify({ ...copy(linkCode), cursor: 'ready' })
    expect(setupState.state?.cursor).toBe('ready')
  })

  it('renews its driver claim every 10 s, only while the page is visible', async () => {
    routes['POST /server/muon/setup/driver'] = () => json({ result: { ok: true, error: null, state: copy(networkPhone) } })
    make().start()
    await vi.advanceTimersByTimeAsync(0)
    FakeSocket.last.open()
    await vi.advanceTimersByTimeAsync(0)

    await vi.advanceTimersByTimeAsync(10000)
    const renewals = calls('/server/muon/setup/driver', 'POST')
    expect(renewals).toHaveLength(1)
    expect(bodyOf(renewals[0][1])).toEqual({ kind: 'web', client_id: PHONE, rev: 4 })

    doc.setVisible(false)
    await vi.advanceTimersByTimeAsync(30000)
    expect(calls('/server/muon/setup/driver', 'POST')).toHaveLength(1)

    doc.setVisible(true)
    await vi.advanceTimersByTimeAsync(0)
    expect(calls('/server/muon/setup/driver', 'POST')).toHaveLength(2)
  })

  it('does not renew a claim another surface holds', async () => {
    setupState.local.clientId = 'another-tab'
    make().start()
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(30000)
    expect(calls('/server/muon/setup/driver', 'POST')).toHaveLength(0)
  })

  it('claims the driver as the phone on the hotspot', async () => {
    const origin = 'http://10.42.0.1'
    routes['POST /server/muon/setup/driver'] = () => json({ result: { ok: true, error: null, state: copy(networkPhone) } })
    make(origin)
    await client.claimDriver()
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('http://10.42.0.1/server/muon/setup/driver')
    expect(bodyOf(init)).toMatchObject({ kind: 'phone', client_id: PHONE })
  })

  it('says the printer cannot be set up from a phone when it has no muon_setup (404)', async () => {
    routes['GET /server/muon/setup'] = () => json({ error: { code: 404, message: 'Not Found' } }, 404)
    setupState.unavailable = false
    make().start()
    await vi.advanceTimersByTimeAsync(0)

    expect(setupState.unavailable).toBe(true)
    expect(setupState.state).toBeNull()
  })

  it('takes a GET answer whatever its rev, as after a reset on the printer', async () => {
    setupState.state = copy(linkCode)
    make().start()
    await vi.advanceTimersByTimeAsync(0)

    // The printer answers with rev 4, older than the rev 12 held.
    expect(setupState.state?.rev).toBe(4)
  })

  it('gives up on a hung one-shot token after 2 s, keeping the 1 s reconnect', async () => {
    routes['GET /access/oneshot_token'] = (init) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    })
    make().start()
    await vi.advanceTimersByTimeAsync(0)
    FakeSocket.last.drop()

    await vi.advanceTimersByTimeAsync(1000)
    expect(FakeSocket.all).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(2000)
    expect(FakeSocket.all).toHaveLength(2)
    expect(FakeSocket.last.url).toBe('ws://muon-walnut-8987.local/websocket')
  })

  it('asks for options with only a country', async () => {
    routes['GET /server/muon/setup/options'] = () => json({ result: { languages: [], region: {} } })
    make()
    await client.options('GB')
    await client.options()

    const urls = fetchImpl.mock.calls.map(([url]) => String(url))
    expect(urls).toContain(`${ORIGIN}/server/muon/setup/options?country=GB`)
    expect(urls).toContain(`${ORIGIN}/server/muon/setup/options`)
  })
})
