import { beforeEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import type { InstanceConfig } from '@/store/config/types'

// activate.ts pulls in the store, Fluidd's init and the Iroh transport at
// import. Each is replaced by something the test can hold back.
const init = vi.hoisted(() => ({ appInit: vi.fn() }))
vi.mock('@/init', () => init)
vi.mock('@/store', () => ({ default: { state: { config: { hostConfig: {} } } } }))
const cloud = vi.hoisted(() => ({
  borrowCloudPrinter: vi.fn(),
  dropCloudConnection: vi.fn(),
  setActiveCloudPrinter: vi.fn(),
  printerName: vi.fn(() => 'Boxwood · 367A'),
  cloudState: { activePrinterId: null }
}))
vi.mock('../state', () => cloud)
vi.mock('../discovery', () => ({ pageReach: vi.fn(async () => 'reached'), isOwnHotspot: vi.fn(() => false) }))
vi.mock('@/services/managed-session/httpTransportBinding', () => ({ bindHttpClientToPrinterTransport: vi.fn(() => () => {}) }))

const { activateCloudPrinter, activateLocalPrinter, activationState, LOAD_WAIT_MS, REMOTE_OPEN_TIMEOUT_MS, RemoteOpenTimeout, SwitchSuperseded } = await import('../activate')

const walnut: InstanceConfig = {
  name: 'Walnut · 8987',
  apiUrl: 'http://192.168.137.73',
  socketUrl: 'ws://192.168.137.73/websocket',
  active: true
}

const socket = { close: vi.fn(), connect: vi.fn(), releaseTransportSocket: vi.fn(), adoptTransportSocket: vi.fn() }

function later<T> () {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(_resolve => { resolve = _resolve })
  return { promise, resolve }
}

function transport () {
  return { fetch: vi.fn(), openWebSocket: vi.fn(async () => ({ close: vi.fn() })), close: vi.fn() }
}

function loaded (apiUrl: string) {
  return { apiConfig: { apiUrl, socketUrl: apiUrl.replace(/^http/, 'ws') + '/websocket' }, apiConnected: true, apiAuthenticated: true }
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(Vue as any).$socket = socket
  ;(Vue as any).$httpClient = {}
})

describe('switching printers', () => {
  it('never loads two printers at once: the second waits for the first', async () => {
    // Two appInits at once reset each other's store; on 14 Oct the page
    // ended on Walnut's address after Boxwood was asked for.
    const walnutLoad = later<ReturnType<typeof loaded>>()
    init.appInit.mockReturnValueOnce(walnutLoad.promise)
    cloud.borrowCloudPrinter.mockResolvedValue(transport())
    init.appInit.mockResolvedValue(loaded('https://muon-cloud.invalid'))

    const toWalnut = activateLocalPrinter(walnut)
    await vi.waitFor(() => expect(init.appInit).toHaveBeenCalledTimes(1))
    const toBoxwood = activateCloudPrinter('boxwood')
    await vi.waitFor(() => expect(cloud.borrowCloudPrinter).toHaveBeenCalled())
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(init.appInit).toHaveBeenCalledTimes(1)
    expect(cloud.setActiveCloudPrinter).not.toHaveBeenCalledWith('boxwood')

    walnutLoad.resolve(loaded(walnut.apiUrl))
    await expect(toWalnut).resolves.toBe(false)
    await toBoxwood
    // Replaced while it loaded: Walnut's socket is never opened under Boxwood.
    expect(socket.connect).not.toHaveBeenCalled()
    expect(cloud.setActiveCloudPrinter).toHaveBeenLastCalledWith('boxwood')
    expect(socket.adoptTransportSocket).toHaveBeenCalledOnce()
  })

  it('tells the caller when a later switch replaced it, rather than resolving as if it worked', async () => {
    // A superseded switch used to resolve, and the Printers page then went
    // to "the printer Fluidd is on", which was another one.
    const borrowed = later<ReturnType<typeof transport>>()
    cloud.borrowCloudPrinter.mockReturnValueOnce(borrowed.promise)
    init.appInit.mockResolvedValue(loaded(walnut.apiUrl))

    const toBoxwood = activateCloudPrinter('boxwood')
    const toWalnut = activateLocalPrinter(walnut)
    const boxwood = transport()
    borrowed.resolve(boxwood)

    await expect(toBoxwood).rejects.toBeInstanceOf(SwitchSuperseded)
    await expect(toWalnut).resolves.toBe(true)
    expect(boxwood.close).toHaveBeenCalled()
    expect(cloud.setActiveCloudPrinter).not.toHaveBeenCalledWith('boxwood')
    expect(init.appInit).toHaveBeenCalledTimes(1)
    expect(init.appInit.mock.calls[0][0]).toBe(walnut)
    expect(socket.connect).toHaveBeenCalledWith(walnut.socketUrl)
  })

  it('does not load a switch that was replaced while it waited its turn', async () => {
    const walnutLoad = later<ReturnType<typeof loaded>>()
    init.appInit.mockReturnValueOnce(walnutLoad.promise)
    init.appInit.mockResolvedValue(loaded(walnut.apiUrl))
    cloud.borrowCloudPrinter.mockResolvedValue(transport())

    const first = activateLocalPrinter(walnut)
    await vi.waitFor(() => expect(init.appInit).toHaveBeenCalledTimes(1))
    const toBoxwood = activateCloudPrinter('boxwood')
    const again = activateLocalPrinter(walnut)
    walnutLoad.resolve(loaded(walnut.apiUrl))

    await expect(first).resolves.toBe(false)
    await expect(toBoxwood).rejects.toBeInstanceOf(SwitchSuperseded)
    await expect(again).resolves.toBe(true)
    expect(cloud.setActiveCloudPrinter).not.toHaveBeenCalledWith('boxwood')
    expect(init.appInit.mock.calls.map(c => c[0])).toEqual([walnut, walnut])
  })

  it('lets the next printer open while a switch still waits for its grant', async () => {
    // Codex on #75: a grant retried for ever must not hold every later switch.
    cloud.borrowCloudPrinter.mockReturnValueOnce(new Promise(() => {}))
    init.appInit.mockResolvedValue(loaded(walnut.apiUrl))

    const stuck = activateCloudPrinter('boxwood')
    stuck.catch(() => {})
    await expect(activateLocalPrinter(walnut)).resolves.toBe(true)
  })

  it('waits for a load that stalls only so long', async () => {
    vi.useFakeTimers()
    try {
      init.appInit.mockReturnValueOnce(new Promise(() => {}))
      init.appInit.mockResolvedValue(loaded(walnut.apiUrl))

      activateLocalPrinter(walnut).catch(() => {})
      await vi.waitFor(() => expect(init.appInit).toHaveBeenCalledTimes(1))
      const next = activateLocalPrinter(walnut)
      await vi.advanceTimersByTimeAsync(LOAD_WAIT_MS)
      await expect(next).resolves.toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('opening a printer through Muon3D', () => {
  // Boxwood, 27 Oct: the grant reached the printer and its gateway connection
  // opened, but no request followed, and the page said "Opening" for good.
  it('gives up after a while, says why, and lets go of the printer, when the load never finishes', async () => {
    vi.useFakeTimers()
    try {
      const boxwood = transport()
      cloud.borrowCloudPrinter.mockResolvedValue(boxwood)
      const stalled = later<ReturnType<typeof loaded>>()
      init.appInit.mockReturnValueOnce(stalled.promise)

      const opening = activateCloudPrinter('boxwood')
      const settled = expect(opening).rejects.toBeInstanceOf(RemoteOpenTimeout)
      // At most LOAD_WAIT_MS behind any load still pending from before.
      await vi.advanceTimersByTimeAsync(LOAD_WAIT_MS)
      expect(init.appInit).toHaveBeenCalledOnce()
      expect(activationState.switching).toBe('boxwood')

      await vi.advanceTimersByTimeAsync(REMOTE_OPEN_TIMEOUT_MS - LOAD_WAIT_MS)
      await settled
      expect(activationState.error).toContain("Boxwood · 367A didn't open through Muon3D")
      expect(activationState.switching).toBeNull()
      expect(boxwood.close).toHaveBeenCalled()
      expect(cloud.setActiveCloudPrinter).toHaveBeenLastCalledWith(null)
      // Trying again dials afresh rather than borrowing the stalled connection.
      expect(cloud.dropCloudConnection).toHaveBeenCalledWith('boxwood')

      // The load finishing late does not bring the abandoned printer back.
      cloud.setActiveCloudPrinter.mockClear()
      stalled.resolve(loaded('https://muon-cloud.invalid'))
      await vi.advanceTimersByTimeAsync(0)
      expect(socket.adoptTransportSocket).not.toHaveBeenCalled()
      expect(cloud.setActiveCloudPrinter).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('gives up on a grant that never comes, and closes the printer if it comes later', async () => {
    vi.useFakeTimers()
    try {
      const borrowed = later<ReturnType<typeof transport>>()
      cloud.borrowCloudPrinter.mockReturnValueOnce(borrowed.promise)

      const opening = activateCloudPrinter('boxwood')
      const settled = expect(opening).rejects.toBeInstanceOf(RemoteOpenTimeout)
      await vi.advanceTimersByTimeAsync(REMOTE_OPEN_TIMEOUT_MS)
      await settled

      const boxwood = transport()
      borrowed.resolve(boxwood)
      await vi.waitFor(() => expect(boxwood.close).toHaveBeenCalled())
      expect(init.appInit).not.toHaveBeenCalled()
      expect(cloud.setActiveCloudPrinter).not.toHaveBeenCalledWith('boxwood')
    } finally {
      vi.useRealTimers()
    }
  })

  it('leaves the printer Fluidd is on alone when the next one times out waiting for its grant', async () => {
    vi.useFakeTimers()
    try {
      const boxwood = transport()
      cloud.borrowCloudPrinter.mockResolvedValueOnce(boxwood)
      init.appInit.mockResolvedValue(loaded('https://muon-cloud.invalid'))
      const first = activateCloudPrinter('boxwood')
      await vi.advanceTimersByTimeAsync(LOAD_WAIT_MS)
      await first
      cloud.setActiveCloudPrinter.mockClear()

      cloud.borrowCloudPrinter.mockReturnValueOnce(new Promise(() => {}))
      const second = activateCloudPrinter('walnut')
      const settled = expect(second).rejects.toBeInstanceOf(RemoteOpenTimeout)
      await vi.advanceTimersByTimeAsync(REMOTE_OPEN_TIMEOUT_MS)
      await settled

      expect(boxwood.close).not.toHaveBeenCalled()
      expect(cloud.setActiveCloudPrinter).not.toHaveBeenCalled()
      expect(activationState.error).toContain("didn't open through Muon3D")
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not time out a printer that opens in time', async () => {
    vi.useFakeTimers()
    try {
      cloud.borrowCloudPrinter.mockResolvedValue(transport())
      init.appInit.mockResolvedValue(loaded('https://muon-cloud.invalid'))

      const opening = activateCloudPrinter('boxwood')
      await vi.advanceTimersByTimeAsync(LOAD_WAIT_MS)
      await opening
      await vi.advanceTimersByTimeAsync(REMOTE_OPEN_TIMEOUT_MS)
      expect(activationState.error).toBeNull()
      expect(cloud.setActiveCloudPrinter).toHaveBeenLastCalledWith('boxwood')
    } finally {
      vi.useRealTimers()
    }
  })
})
