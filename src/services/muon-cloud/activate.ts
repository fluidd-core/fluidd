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
import { borrowCloudPrinter, cloudState, printerName, setActiveCloudPrinter } from './state'
import { MANAGED_API_URL, MANAGED_SOCKET_URL } from './origin'
import { pageCanReach } from './discovery'

export { MANAGED_API_URL, MANAGED_SOCKET_URL }

export const activationState = Vue.observable({
  switching: null as string | null,
  error: null as string | null,
  /** The printer's own page, when this page may not reach the printer itself. */
  fallbackUrl: null as string | null
})

let current: { transport: PrinterTransport, release: () => void } | null = null
let generation = 0

function releaseCurrent () {
  if (!current) return
  Vue.$socket?.releaseTransportSocket(true)
  current.release()
  current.transport.close()
  current = null
}

/** Points Fluidd at a cloud printer. */
export async function activateCloudPrinter (printerId: string) {
  const mine = ++generation
  activationState.switching = printerId
  activationState.error = null
  activationState.fallbackUrl = null
  try {
    Vue.$socket?.releaseTransportSocket(true)
    releaseCurrent()
    const transport = await borrowCloudPrinter(printerId)
    if (mine !== generation) {
      transport.close()
      return
    }
    const release = bindHttpClientToPrinterTransport(Vue.$httpClient, transport)
    current = { transport, release }
    setActiveCloudPrinter(printerId)

    const instance: InstanceConfig = {
      name: printerName(printerId),
      apiUrl: MANAGED_API_URL,
      socketUrl: MANAGED_SOCKET_URL,
      active: true
    }
    await appInit(instance, store.state.config.hostConfig)
    if (mine !== generation) return

    const socket = await transport.openWebSocket('/websocket')
    if (mine !== generation) {
      socket.close()
      return
    }
    Vue.$socket.adoptTransportSocket(socket, () => transport.openWebSocket('/websocket'))
  } catch (error) {
    if (mine === generation) {
      activationState.error = (error as Error).message
      setActiveCloudPrinter(null)
      releaseCurrent()
    }
    throw error
  } finally {
    if (mine === generation) activationState.switching = null
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
 * browser.
 */
export async function activateLocalPrinter (instance: InstanceConfig): Promise<boolean> {
  activationState.error = null
  activationState.fallbackUrl = null
  const name = instance.name || instance.apiUrl
  if (!await pageCanReach(instance.apiUrl)) {
    activationState.error = `This browser does not let ${location.host} reach ${name} on your network.`
    activationState.fallbackUrl = `${instance.apiUrl.replace(/\/+$/, '')}/`
    return false
  }
  ++generation
  releaseCurrent()
  setActiveCloudPrinter(null)
  forgetManagedInstance()
  Vue.$socket?.close()
  const config = await appInit(instance, store.state.config.hostConfig)
  if (config.apiConfig.socketUrl && config.apiConnected && config.apiAuthenticated) {
    Vue.$socket.connect(config.apiConfig.socketUrl)
  }
  const connected = config.apiConnected === true
  if (!connected) activationState.error = `Could not connect to ${name}.`
  return connected
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
