import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import type { InstanceConfig } from '@/store/config/types'

// activate.ts pulls in the store, Fluidd's init and the Iroh transport at
// import. None of them is under test here.
const init = vi.hoisted(() => ({ appInit: vi.fn() }))
vi.mock('@/init', () => init)
vi.mock('@/store', () => ({ default: { state: { config: { hostConfig: {} } } } }))
vi.mock('../api', () => ({ cloudApi: {} }))
vi.mock('../iroh', () => ({ managedEndpointFactory: vi.fn() }))
vi.mock('../state', () => ({
  cloudState: { account: null },
  printerName: vi.fn(),
  requestAccess: vi.fn(),
  setActiveCloudPrinter: vi.fn()
}))
vi.mock('@/services/managed-transport', () => ({ createPrinterTransportForSelection: vi.fn() }))
vi.mock('@/services/managed-session/httpTransportBinding', () => ({ bindHttpClientToPrinterTransport: vi.fn() }))

const { activateLocalPrinter, activationState } = await import('../activate')
const { nearbyHost, pageCanReach, pageReach } = await import('../discovery')

const printer: InstanceConfig = {
  name: 'Muon-boxwood-367a',
  apiUrl: 'http://192.168.1.153',
  socketUrl: 'ws://192.168.1.153/websocket',
  active: true
}

const socket = { close: vi.fn(), connect: vi.fn(), releaseTransportSocket: vi.fn() }

/** The page's own origin: app.muon3d.com, or a printer's plain-HTTP page. */
function servedOver (protocol: 'https:' | 'http:') {
  vi.stubGlobal('location', { protocol, host: 'app.muon3d.com', hostname: 'app.muon3d.com' })
}

/** The browser's answer to the reachability check. */
function browserSays (outcome: 'answers' | 'blocks') {
  const fetch = vi.fn(async () => {
    if (outcome === 'blocks') throw new TypeError('Failed to fetch')
    return { ok: false, status: 0, type: 'opaque' } as Response
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

/** Chromium's local network permission for this page. */
function localNetwork (state: PermissionState) {
  vi.stubGlobal('navigator', {
    ...navigator,
    permissions: {
      query: vi.fn(async ({ name }: { name: string }) => {
        if (name !== 'local-network-access') throw new TypeError(`no permission ${name}`)
        return { state }
      })
    }
  })
}

function moonraker (apiConnected: boolean, apiAuthenticated = apiConnected) {
  init.appInit.mockResolvedValue({
    apiConfig: { apiUrl: printer.apiUrl, socketUrl: printer.socketUrl },
    apiConnected,
    apiAuthenticated
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(Vue as any).$socket = socket
  activationState.error = null
  activationState.fallbackUrl = null
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('pageCanReach', () => {
  it('asks the printer with a local-network declaration from app.muon3d.com', async () => {
    servedOver('https:')
    const fetch = browserSays('answers')

    expect(await pageCanReach(printer.apiUrl)).toBe(true)
    expect(fetch).toHaveBeenCalledOnce()
    const [url, request] = fetch.mock.calls[0] as unknown as [string, RequestInit & { targetAddressSpace?: string }]
    expect(url).toBe('http://192.168.1.153/server/info')
    expect(request.mode).toBe('no-cors')
    expect(request.targetAddressSpace).toBe('local')
  })

  it('is false when the browser blocks the request as mixed content', async () => {
    servedOver('https:')
    browserSays('blocks')

    expect(await pageCanReach(printer.apiUrl)).toBe(false)
  })

  it('tells a block from an address nobody answers on', async () => {
    servedOver('https:')
    browserSays('blocks')
    expect(await pageReach(printer.apiUrl)).toBe('blocked')

    localNetwork('denied')
    expect(await pageReach(printer.apiUrl)).toBe('blocked')

    // Chrome let the request out, so nobody is at that address.
    localNetwork('granted')
    expect(await pageReach(printer.apiUrl)).toBe('silent')

    // A name may resolve to a public IPv6 address, which is still blocked.
    expect(await pageReach('http://muon-boxwood-367a.local')).toBe('blocked')
  })

  it('takes a request that waits out the time limit as unanswered, unless the prompt is still open', async () => {
    servedOver('https:')
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    })))
    expect(await pageReach(printer.apiUrl, 5)).toBe('silent')

    localNetwork('prompt')
    expect(await pageReach(printer.apiUrl, 5)).toBe('asking')
  })

  it('does not ask from a plain-HTTP page, where nothing is mixed content', async () => {
    servedOver('http:')
    const fetch = browserSays('blocks')

    expect(await pageCanReach(printer.apiUrl)).toBe(true)
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('activateLocalPrinter', () => {
  it('leaves Fluidd where it was, and offers the printer page, when the browser blocks it', async () => {
    servedOver('https:')
    browserSays('blocks')
    moonraker(true)

    expect(await activateLocalPrinter(printer)).toBe(false)
    expect(init.appInit).not.toHaveBeenCalled()
    expect(socket.close).not.toHaveBeenCalled()
    expect(activationState.error).toContain('Muon-boxwood-367a')
    expect(activationState.fallbackUrl).toBe('http://192.168.1.153/')
  })

  it('connects and reports success when the printer answers', async () => {
    servedOver('https:')
    browserSays('answers')
    moonraker(true)

    expect(await activateLocalPrinter(printer)).toBe(true)
    expect(init.appInit).toHaveBeenCalledOnce()
    expect(socket.connect).toHaveBeenCalledWith(printer.socketUrl)
    expect(activationState.error).toBeNull()
    expect(activationState.fallbackUrl).toBeNull()
  })

  it('reports success for a printer that wants a password, so its login page shows', async () => {
    servedOver('https:')
    browserSays('answers')
    moonraker(true, false)

    expect(await activateLocalPrinter(printer)).toBe(true)
    expect(socket.connect).not.toHaveBeenCalled()
  })

  it('says the printer is not answering, and offers no page, when the browser let the request out', async () => {
    // The page Control used to offer here did not load either: nothing holds
    // the address.
    servedOver('https:')
    browserSays('blocks')
    localNetwork('granted')

    expect(await activateLocalPrinter(printer)).toBe(false)
    expect(activationState.error).toContain("isn't answering at 192.168.1.153")
    expect(activationState.error).not.toContain('does not let')
    expect(activationState.fallbackUrl).toBeNull()
  })

  it('asks the person to answer the browser\'s prompt while it is open', async () => {
    servedOver('https:')
    browserSays('blocks')
    localNetwork('prompt')

    expect(await activateLocalPrinter(printer)).toBe(false)
    expect(activationState.error).toContain('when the browser asks')
    expect(activationState.fallbackUrl).toBe('http://192.168.1.153/')
  })

  it('offers no page for the printer\'s own hotspot address, which nobody on the home network reaches', async () => {
    servedOver('https:')
    browserSays('blocks')

    expect(await activateLocalPrinter({ ...printer, apiUrl: 'http://10.42.0.1' })).toBe(false)
    expect(activationState.error).toContain('own hotspot')
    expect(activationState.fallbackUrl).toBeNull()
  })

  it('reports failure, with no printer page to offer, when Moonraker never answers', async () => {
    servedOver('https:')
    browserSays('answers')
    moonraker(false)

    expect(await activateLocalPrinter(printer)).toBe(false)
    expect(activationState.error).toBe('Could not connect to Muon-boxwood-367a.')
    expect(activationState.fallbackUrl).toBeNull()
  })
})

describe('nearbyHost', () => {
  it("skips the printer's own hotspot address, which sorts first", () => {
    expect(nearbyHost(['10.42.0.1', '192.168.1.153'])).toBe('192.168.1.153')
  })

  it('offers no address when the hotspot is the only one reported', () => {
    // Boxwood, 27 Oct: on the home Wi-Fi since 21:29, while the service still
    // gave 10.42.0.1 alone at 00:30, and Control offered http://10.42.0.1/.
    expect(nearbyHost(['10.42.0.1'])).toBeNull()
  })

  it('keeps other 10.x networks, which are ordinary home and office LANs', () => {
    expect(nearbyHost(['10.0.0.12'])).toBe('10.0.0.12')
  })

  it('has nothing to offer for a printer that reported no address', () => {
    expect(nearbyHost([])).toBeNull()
  })
})
