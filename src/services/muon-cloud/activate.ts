/**
 * Switching Fluidd between printers: a local one over the LAN, or a cloud one
 * over Iroh.
 *
 * A cloud printer reuses Fluidd's own machinery end to end. Axios is routed
 * through the Iroh transport, `appInit` loads the printer's own database (its
 * dashboard layout lives there), and the socket client adopts a WebSocket that
 * runs through the gateway. Nothing above that layer knows the difference.
 */
import Vue from 'vue'
import store from '@/store'
import { appInit } from '@/init'
import type { InstanceConfig } from '@/store/config/types'
import { Globals } from '@/globals'
import { bindHttpClientToPrinterTransport } from '@/services/managed-session/httpTransportBinding'
import { type PrinterTransport } from '@/services/managed-transport'
import { borrowCloudPrinter, cloudState, dropCloudConnection, printerName, setActiveCloudPrinter } from './state'
import { MANAGED_API_URL, MANAGED_SOCKET_URL } from './origin'
import { isOwnHotspot, pageReach } from './discovery'

export { MANAGED_API_URL, MANAGED_SOCKET_URL }

export const activationState = Vue.observable({
  switching: null as string | null,
  error: null as string | null,
  /** The printer's own page, when this page may not reach the printer itself. */
  fallbackUrl: null as string | null
})

let current: { transport: PrinterTransport, release: () => void } | null = null
let generation = 0

/**
 * A switch that a later one replaced before it finished. Its caller must not
 * go on to "the printer Fluidd is on", which is another printer by then (or
 * still the one before): on 14 Oct a superseded switch to Boxwood returned as
 * if it had worked, and the page went to Walnut's address.
 */
export class SwitchSuperseded extends Error {
  constructor () {
    super('Another printer was opened meanwhile')
    this.name = 'SwitchSuperseded'
  }
}

/**
 * How long a switch waits for the one before it to finish loading. A load
 * that stalls (an Iroh read has no time limit) must not hold up every later
 * switch until the page is reloaded.
 */
export const LOAD_WAIT_MS = 10_000

let loading: Promise<unknown> = Promise.resolve()

/**
 * Loads printers into the store one at a time. Each switch resets the store
 * and loads its printer (`appInit`), and two interleaved left one printer's
 * address over the other's data. Only the loading waits its turn: a switch
 * still asking the console for a grant, or checking that this page can reach
 * a printer, holds up nobody. A switch replaced while it waited never loads.
 */
async function oneAtATime<T> (mine: number, work: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  await Promise.race([
    loading.catch(() => {}),
    new Promise(resolve => { timer = setTimeout(resolve, LOAD_WAIT_MS) })
  ])
  clearTimeout(timer)
  if (mine !== generation) throw new SwitchSuperseded()
  const run = work()
  loading = run.catch(() => {})
  return run
}

function releaseCurrent () {
  if (!current) return
  Vue.$socket?.releaseTransportSocket(true)
  current.release()
  current.transport.close()
  current = null
}

/**
 * How long opening a printer through Muon3D may take, from asking the console
 * for a grant to the printer's socket, including up to `LOAD_WAIT_MS` behind
 * another printer's load. An Iroh read has no time limit of its own, so a
 * printer whose link to the relay keeps dropping held the page on "Opening"
 * for good: Boxwood on 27 Oct, on weak Wi-Fi while it downloaded an update,
 * lost the relay about once a minute.
 */
export const REMOTE_OPEN_TIMEOUT_MS = 30_000

/** Opening a printer through Muon3D took longer than `REMOTE_OPEN_TIMEOUT_MS`. */
export class RemoteOpenTimeout extends Error {
  constructor (name: string) {
    super(`${name} didn't open through Muon3D within ${REMOTE_OPEN_TIMEOUT_MS / 1000} seconds. ` +
      'The printer or its connection may be slow or offline: check that it\'s on and online, then try again.')
    this.name = 'RemoteOpenTimeout'
  }
}

/**
 * Points Fluidd at a cloud printer. Rejects with `SwitchSuperseded` when
 * another printer is opened before this one is on.
 */
export async function activateCloudPrinter (printerId: string) {
  const mine = ++generation
  const superseded = () => mine !== generation
  activationState.switching = printerId
  activationState.error = null
  activationState.fallbackUrl = null
  // Set inside `open`, so typed here rather than narrowed to null.
  let transport = null as PrinterTransport | null
  const open = async () => {
    try {
      // The printer Fluidd is on stays usable while the grant comes.
      const borrowed = transport = await borrowCloudPrinter(printerId)
      if (superseded()) throw new SwitchSuperseded()
      await oneAtATime(mine, async () => {
        Vue.$socket?.releaseTransportSocket(true)
        releaseCurrent()
        const release = bindHttpClientToPrinterTransport(Vue.$httpClient, borrowed)
        current = { transport: borrowed, release }
        setActiveCloudPrinter(printerId)

        const instance: InstanceConfig = {
          name: printerName(printerId),
          apiUrl: MANAGED_API_URL,
          socketUrl: MANAGED_SOCKET_URL,
          active: true
        }
        await appInit(instance, store.state.config.hostConfig, { isCurrent: () => !superseded() })
        if (superseded()) throw new SwitchSuperseded()

        const socket = await borrowed.openWebSocket('/websocket')
        if (superseded()) {
          socket.close()
          throw new SwitchSuperseded()
        }
        Vue.$socket.adoptTransportSocket(socket, () => borrowed.openWebSocket('/websocket'))
      })
    } catch (error) {
      // Replaced before it was bound: nothing else will close it.
      if (transport && current?.transport !== transport) transport.close()
      throw error
    }
  }
  const opening = open()
  // Given up on below, it may still fail later, with nobody listening.
  opening.catch(() => {})
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      opening,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new RemoteOpenTimeout(printerName(printerId))), REMOTE_OPEN_TIMEOUT_MS)
      })
    ])
  } catch (error) {
    if (!superseded() && !(error instanceof SwitchSuperseded)) {
      activationState.error = (error as Error).message
      // Timed out before this printer was bound: the one Fluidd is on stays.
      const bound = !(error instanceof RemoteOpenTimeout) || (!!transport && current?.transport === transport)
      if (bound) {
        setActiveCloudPrinter(null)
        releaseCurrent()
      }
      if (error instanceof RemoteOpenTimeout) {
        transport?.close()
        // Trying again must dial afresh, not borrow the stalled connection.
        dropCloudConnection(printerId)
        activationState.switching = null
        // The open still waits on Iroh: at its next step it finds it was replaced.
        ++generation
      }
    }
    throw error
  } finally {
    clearTimeout(timer)
    if (!superseded()) activationState.switching = null
  }
}

function hostOf (apiUrl: string): string {
  try {
    return new URL(apiUrl).hostname
  } catch {
    return apiUrl
  }
}

/**
 * Points Fluidd back at a printer on the local network.
 *
 * Resolves true once Moonraker answered, including when it wants a password,
 * so the caller can show the dashboard. False leaves the reason in
 * `activationState.error`. Where this page may not reach the printer at all,
 * Fluidd stays on the printer it had, nothing is saved, and
 * `activationState.fallbackUrl` is the printer's own page, which works in any
 * browser. False with no reason: another printer was opened meanwhile.
 */
export async function activateLocalPrinter (instance: InstanceConfig): Promise<boolean> {
  const mine = ++generation
  const superseded = () => mine !== generation
  // A cloud switch this one replaces no longer says it is opening.
  activationState.switching = null
  activationState.error = null
  activationState.fallbackUrl = null
  const name = instance.name || instance.apiUrl
  try {
    const reach = await pageReach(instance.apiUrl)
    if (reach !== 'reached') {
      if (superseded()) throw new SwitchSuperseded()
      const host = hostOf(instance.apiUrl)
      // The printer's own page is offered only where it would open: the
      // browser blocked this page, and the address is one on this network.
      // An address that went unanswered, or the printer's own hotspot, would
      // not load there either.
      if (reach === 'silent') {
        activationState.error = `${name} isn't answering at ${host}. Check that it's on, or search again: it may have a new address.`
      } else if (isOwnHotspot(host)) {
        activationState.error = `${host} is ${name}'s own hotspot, which only a device joined to it can reach. Search again to find it on your network.`
      } else {
        activationState.error = reach === 'asking'
          ? `Let ${location.host} look for devices on your local network when the browser asks, then open ${name} again.`
          : `This browser does not let ${location.host} reach ${name} on your network.`
        activationState.fallbackUrl = `${instance.apiUrl.replace(/\/+$/, '')}/`
      }
      return false
    }
    return await oneAtATime(mine, async () => {
      releaseCurrent()
      setActiveCloudPrinter(null)
      forgetManagedInstance()
      Vue.$socket?.close()
      const config = await appInit(instance, store.state.config.hostConfig, { isCurrent: () => !superseded() })
      // Replaced while it loaded: the next switch connects its own printer.
      if (superseded()) throw new SwitchSuperseded()
      if (config.apiConfig.socketUrl && config.apiConnected && config.apiAuthenticated) {
        Vue.$socket.connect(config.apiConfig.socketUrl)
      }
      const connected = config.apiConnected === true
      if (!connected) activationState.error = `Could not connect to ${name}.`
      return connected
    })
  } catch (error) {
    if (error instanceof SwitchSuperseded) return false
    throw error
  }
}

/**
 * Removes the placeholder instance Fluidd records while a cloud printer is
 * selected, and makes a real instance the active one again.
 */
export function forgetManagedInstance () {
  try {
    const key = Globals.LOCAL_INSTANCES_STORAGE_KEY
    const raw = localStorage.getItem(key)
    if (!raw) return
    const instances: InstanceConfig[] = JSON.parse(raw)
    const kept = instances.filter(i => i.apiUrl !== MANAGED_API_URL)
    if (kept.length === instances.length) return
    if (kept.length && !kept.some(i => i.active)) kept[0].active = true
    if (kept.length) localStorage.setItem(key, JSON.stringify(kept))
    else localStorage.removeItem(key)
  } catch { /* no storage, or not ours to parse */ }
}

/** Whether Fluidd is showing a cloud printer now. */
export function isCloudActive (): boolean {
  return current !== null && cloudState.activePrinterId !== null
}
