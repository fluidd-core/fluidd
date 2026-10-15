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
  setActiveCloudPrinter: vi.fn(),
  printerName: vi.fn(() => 'Boxwood · 367A'),
  cloudState: { activePrinterId: null }
}))
vi.mock('../state', () => cloud)
vi.mock('../discovery', () => ({ pageCanReach: vi.fn(async () => true) }))
vi.mock('@/services/managed-session/httpTransportBinding', () => ({ bindHttpClientToPrinterTransport: vi.fn(() => () => {}) }))

const { activateCloudPrinter, activateLocalPrinter, LOAD_WAIT_MS, SwitchSuperseded } = await import('../activate')

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
