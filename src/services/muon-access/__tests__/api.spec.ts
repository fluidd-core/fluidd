import { afterEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import { AccessRefused, AccessUnavailable, currentPrinterAccess, lanPrinterAccess } from '../api'

function answer (body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

describe('lanPrinterAccess', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads the state from the printer at its address', async () => {
    // "no owner, Open, anyone at home" in Moonraker's tests/assets/muon_access_contract.json
    const state = {
      owner: { kind: 'none' },
      entry: 'open',
      you: { level: 'signed-out-guest', role: 'operator', trusted: false, principal: 'anyone at home' },
      ways: { email: { on: false }, link: { on: false }, password: { on: false }, approve: { on: false } },
      privateUploads: false,
      dataMode: 'shared',
      levelsPreset: 'standard'
    }
    const fetch = vi.fn(async () => answer({ result: state }))
    vi.stubGlobal('fetch', fetch)

    await expect(lanPrinterAccess('http://192.168.137.88/').get()).resolves.toEqual(state)
    expect(fetch).toHaveBeenCalledWith('http://192.168.137.88/server/muon/access/get', expect.objectContaining({ cache: 'no-store' }))
  })

  it('says the printer has no access settings when Moonraker does not know the method', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => answer({ error: { code: 404, message: 'Not Found' } }, 404)))
    await expect(lanPrinterAccess('http://192.168.137.32').get()).rejects.toBeInstanceOf(AccessUnavailable)
  })

  it('passes on the reason the printer gave for a refusal', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      answer({ error: { code: 403, message: "The printer's screen can be asked only from its home network." } }, 403)))
    const asking = lanPrinterAccess('http://192.168.137.88').request({ kind: 'join' })
    const refusal = await asking.catch(error => error) as AccessRefused
    expect(refusal).toBeInstanceOf(AccessRefused)
    expect(refusal.name).toBe('AccessRefused')
    expect(refusal.status).toBe(403)
    expect(refusal.message).toBe("The printer's screen can be asked only from its home network.")
  })

  it('reports a setting the printer did not apply as not applied', async () => {
    const fetch = vi.fn(async () => answer({ result: { applied: false } }))
    vi.stubGlobal('fetch', fetch)

    await expect(lanPrinterAccess('http://192.168.137.88').setEntry('protected')).resolves.toBe(false)
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('http://192.168.137.88/server/muon/access/set_entry')
    expect(init.method).toBe('POST')
    // Moonraker refuses a write without a JSON body (415).
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(String(init.body))).toEqual({ entry: 'protected' })
  })

  it('asks for a request by its id', async () => {
    const fetch = vi.fn(async () => answer({ result: { status: 'allowed' } }))
    vi.stubGlobal('fetch', fetch)

    await expect(lanPrinterAccess('http://192.168.137.88').requestStatus('r1-abcd')).resolves.toBe('allowed')
    expect((fetch.mock.calls[0] as unknown as [string])[0]).toBe('http://192.168.137.88/server/muon/access/request_status?request_id=r1-abcd')
  })

  it('uses a specific fallback refusal when an invalid error body has no explanation', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not json', { status: 429 })))
    const refusal = await lanPrinterAccess('http://192.168.137.88').get().catch(error => error) as AccessRefused
    expect(refusal).toBeInstanceOf(AccessRefused)
    expect(refusal.status).toBe(429)
    expect(refusal.message).toBe('The printer refused (HTTP 429).')
  })

  it('sends every permissions mutation to its distinct route with its exact body', async () => {
    const fetch = vi.fn<[string, RequestInit], Promise<Response>>(async () => answer({ result: { applied: true } }))
    vi.stubGlobal('fetch', fetch)
    const access = lanPrinterAccess('http://printer.test///')
    await expect(access.setPrivateUploads(true)).resolves.toBe(true)
    await expect(access.setData('accounts')).resolves.toBe(true)
    await expect(access.setLevels('strict')).resolves.toBe(true)
    await access.cancelRequest('request-7')
    expect(fetch.mock.calls.map(([url, init]) => [url, JSON.parse(String((init as RequestInit).body))])).toEqual([
      ['http://printer.test/server/muon/access/set_private_uploads', { enabled: true }],
      ['http://printer.test/server/muon/access/set_data', { mode: 'accounts' }],
      ['http://printer.test/server/muon/access/set_levels', { preset: 'strict' }],
      ['http://printer.test/server/muon/access/cancel_request', { request_id: 'request-7' }]
    ])
  })

  it('preserves an optional request label and unwraps capabilities', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(answer({ result: { actions: { config: 'refused' } } }))
      .mockResolvedValueOnce(answer({ result: { requestId: 'r2', code: 'ABC123', expiresAt: 99 } }))
    vi.stubGlobal('fetch', fetch)
    const access = lanPrinterAccess('http://printer.test')
    await expect(access.capabilities()).resolves.toEqual({ config: 'refused' })
    await expect(access.request({ kind: 'join' }, 'Living room')).resolves.toEqual({ requestId: 'r2', code: 'ABC123', expiresAt: 99 })
    expect(JSON.parse(String((fetch.mock.calls[1][1] as RequestInit).body))).toEqual({ ask: { kind: 'join' }, label: 'Living room' })
  })

  it("uses Fluidd's active transport and preserves transport failures", async () => {
    const networkFailure = new TypeError('socket closed')
    const get = vi.fn().mockResolvedValueOnce({ data: { result: { actions: { read: 'allowed' } } } }).mockRejectedValueOnce(networkFailure)
    const post = vi.fn().mockRejectedValueOnce({ response: { status: 403, data: { error: { message: 'owner only' } } } })
    Vue.$httpClient = { get, post } as unknown as typeof Vue.$httpClient
    await expect(currentPrinterAccess().capabilities()).resolves.toEqual({ read: 'allowed' })
    await expect(currentPrinterAccess().get()).rejects.toBe(networkFailure)
    const refusal = await currentPrinterAccess().setEntry('protected').catch(error => error) as AccessRefused
    expect(refusal).toMatchObject({ name: 'AccessRefused', status: 403, message: 'owner only' })
    expect(post).toHaveBeenCalledWith('/server/muon/access/set_entry', { entry: 'protected' })
  })
})
