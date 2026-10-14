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

const { activateCloudPrinter, activateLocalPrinter, SwitchSuperseded } = await import('../activate')

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
    await Promise.resolve()
    expect(cloud.borrowCloudPrinter).not.toHaveBeenCalled()

    walnutLoad.resolve(loaded(walnut.apiUrl))
    await expect(toWalnut).resolves.toBe(false)
    await toBoxwood
    // Replaced while it loaded: Walnut's socket is never opened under Boxwood.
    expect(socket.connect).not.toHaveBeenCalled()
    expect(cloud.borrowCloudPrinter).toHaveBeenCalledWith('boxwood')
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
    borrowed.resolve(transport())

    await expect(toBoxwood).rejects.toBeInstanceOf(SwitchSuperseded)
    await expect(toWalnut).resolves.toBe(true)
    expect(cloud.setActiveCloudPrinter).not.toHaveBeenCalledWith('boxwood')
    expect(init.appInit).toHaveBeenCalledTimes(1)
    expect(init.appInit.mock.calls[0][0]).toBe(walnut)
    expect(socket.connect).toHaveBeenCalledWith(walnut.socketUrl)
  })

  it('does not start a switch that was replaced while it waited its turn', async () => {
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
    expect(cloud.borrowCloudPrinter).not.toHaveBeenCalled()
  })
})
