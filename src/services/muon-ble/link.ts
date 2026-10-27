/**
 * A Bluetooth link from this page to a printer, joined to the tab's Iroh
 * endpoint (ADR 0032 D3; KAN-435, KAN-436).
 *
 * The radio is driven here, in TypeScript, and every segment goes to the
 * `BleLink` that muon-link-web's `MuonEndpoint.addLink` returns, so QUIC runs
 * over the link with the page's own key (Iroh_BLE `docs/INTEGRATION.md` §3):
 *
 *   TX notification        -> link.onSegment
 *   link.nextSegment()     -> write RX, in order, once each
 *   every second, until HELLO completes: link.retryHandshake()
 *
 * Once the link is up, `endpoint.connect(printerId)` reaches the printer over
 * it: muon-link-web adds a connected link to the printer's address. This is a
 * port of the parts of Iroh_BLE's `blelink-web.js` that muon-link-web's link
 * object supports.
 */
import {
  decodeInfo,
  MUON_BLE_INFO,
  MUON_BLE_RX,
  MUON_BLE_SERVICE,
  MUON_BLE_TX,
  type BleDevice,
  type BleInfo,
  type GattCharacteristic
} from './webBluetooth'

/** The largest segment this page writes to a printer, whatever INFO says. */
export const MAX_WRITE_SEGMENT = 244

/**
 * The segment size to join a link with: the printer's INFO value, capped at
 * {@link MAX_WRITE_SEGMENT}. `0` (the printer did not say) stays `undefined`, so
 * the endpoint keeps its own default.
 */
export function cappedSegment (infoSegment: number): number | undefined {
  if (!infoSegment) return undefined
  return Math.min(infoSegment, MAX_WRITE_SEGMENT)
}

/** muon-link-web's `BleLink`, as far as this driver uses it. */
export interface WasmBleLink {
  onSegment (segment: Uint8Array): void;
  nextSegment (): Promise<Uint8Array | undefined>;
  connected (): Promise<string>;
  retryHandshake (): boolean;
  isClosed (): boolean;
  close (): void;
  onDisconnected (): void;
}

/** An endpoint that takes Bluetooth links: muon-link-web from muon-link#31 on. */
export interface BleCapableEndpoint {
  addLink (role: 'central', maxSegment?: number): WasmBleLink;
}

export function takesBleLinks (endpoint: unknown): endpoint is BleCapableEndpoint {
  return typeof (endpoint as { addLink?: unknown } | null)?.addLink === 'function'
}

export interface BleLinkHandle {
  /** The printer's EndpointId, as `HELLO` and `INFO` both claimed it. */
  printerId: string;
  info: BleInfo;
  /** Hangs up: `BYE`, then the GATT connection. Safe to call more than once. */
  disconnect (): Promise<void>;
  /** Resolves once the GATT connection is gone, whoever ended it. */
  closed: Promise<void>;
  /** True until `closed` resolves. */
  isOpen (): boolean;
}

export interface OpenLinkOptions {
  connectTimeoutMs?: number;
  helloTimeoutMs?: number;
  log?: (line: string) => void;
}

const CONNECT_TIMEOUT_MS = 20_000
/** Iroh_BLE's own driver gives `HELLO` 10 s. */
const HELLO_TIMEOUT_MS = 10_000
const HELLO_RETRY_MS = 1_000
/** How long an orderly hang-up gets to write `BYE` before the radio drops. */
const DRAIN_MS = 2_000
/** Failed writes in a row after which the link is given up. */
const MAX_WRITE_FAILURES = 16

/** One link per device: two would share its GATT connection and every TX notification. */
const owners = new WeakMap<BleDevice, BleLinkHandle | 'opening'>()

function withTimeout<T> (p: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${what} timed out`)), ms)
    p.then(
      v => { clearTimeout(t); resolve(v) },
      e => { clearTimeout(t); reject(e) }
    )
  })
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** A plain `Uint8Array` over an `ArrayBuffer`, as the DOM typings want it spelled. */
const source = (bytes: Uint8Array) => bytes as unknown as BufferSource

async function write (rx: GattCharacteristic, segment: Uint8Array, withResponse: boolean) {
  if (!withResponse && typeof rx.writeValueWithoutResponse === 'function') {
    await rx.writeValueWithoutResponse(source(segment))
  } else if (typeof rx.writeValueWithResponse === 'function') {
    await rx.writeValueWithResponse(source(segment))
  } else {
    throw new Error('RX takes no writes')
  }
}

/**
 * Connects to `device` over GATT and brings up a link on `endpoint`. Needs
 * no click once the page has the device. Rejects if the printer does not
 * answer, or if its `INFO` and `HELLO` name different printers.
 */
export async function openBleLink (
  endpoint: BleCapableEndpoint,
  device: BleDevice,
  options: OpenLinkOptions = {}
): Promise<BleLinkHandle> {
  const log = options.log ?? (() => {})
  const gatt = device.gatt
  if (!gatt) throw new Error('The printer offered no GATT connection.')
  const current = owners.get(device)
  if (current === 'opening' || (current && current.isOpen())) {
    throw new Error('This page is already connected to that printer over Bluetooth.')
  }
  owners.set(device, 'opening')

  let link: WasmBleLink | null = null
  let tx: GattCharacteristic | null = null
  let radioUp = true
  const early: Uint8Array[] = []
  let resolveClosed: () => void = () => {}
  const closed = new Promise<void>(resolve => { resolveClosed = resolve })
  let resolveDrained: () => void = () => {}
  const drained = new Promise<void>(resolve => { resolveDrained = resolve })

  const onNotification = (event: Event) => {
    if (!radioUp) return
    const value = (event.target as GattCharacteristic).value
    if (!value) return
    const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
    if (link) link.onSegment(bytes)
    else early.push(bytes.slice())
  }

  const onGone = () => {
    if (!radioUp) return
    radioUp = false
    device.removeEventListener('gattserverdisconnected', onGone)
    tx?.removeEventListener('characteristicvaluechanged', onNotification)
    link?.onDisconnected()
    if (owners.get(device) === handle || owners.get(device) === 'opening') owners.delete(device)
    log('bluetooth: GATT disconnected')
    resolveClosed()
  }

  const dropGatt = () => {
    if (!radioUp) return
    try {
      gatt.disconnect()
    } catch { /* already gone */ }
    // Some platforms fire no gattserverdisconnected for a local disconnect().
    onGone()
  }

  let disconnecting: Promise<void> | null = null
  const handle: BleLinkHandle = {
    printerId: '',
    info: null as unknown as BleInfo,
    disconnect () {
      disconnecting ??= (async () => {
        if (!radioUp) return
        link?.close()
        await Promise.race([drained, sleep(DRAIN_MS)])
        dropGatt()
      })()
      return disconnecting
    },
    closed,
    isOpen: () => radioUp
  }

  device.addEventListener('gattserverdisconnected', onGone)
  try {
    const { info, rx } = await withTimeout((async () => {
      const server = await gatt.connect()
      const service = await server.getPrimaryService(MUON_BLE_SERVICE)
      // One at a time: some platforms refuse concurrent GATT operations.
      const infoChar = await service.getCharacteristic(MUON_BLE_INFO)
      const rxChar = await service.getCharacteristic(MUON_BLE_RX)
      const txChar = await service.getCharacteristic(MUON_BLE_TX)
      const value = await infoChar.readValue()
      const decoded = decodeInfo(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
      if (!decoded) throw new Error('The printer answered with an INFO value this page does not understand.')
      if (!radioUp) throw new Error('The printer went away while connecting.')
      tx = txChar
      // Listen before subscribing, so no notification is missed.
      tx.addEventListener('characteristicvaluechanged', onNotification)
      if (typeof tx.startNotifications === 'function') await tx.startNotifications()
      return { info: decoded, rx: rxChar }
    })(), options.connectTimeoutMs ?? CONNECT_TIMEOUT_MS, 'Connecting over Bluetooth')
    if (!radioUp) throw new Error('The printer went away while connecting.')

    // Web Bluetooth cannot read the MTU: the printer's INFO value is what counts,
    // up to a cap. A printer with a 517-byte ATT MTU says 512, and BlueZ on the
    // M1 silently drops 512-byte Write Commands (D-Bus capture, 20 Oct 2026: 14
    // WriteValue calls for 45 ATT writes; only the short segments arrived), so a
    // QUIC Initial never completes. 244 fits one link-layer PDU (244 + 3 ATT +
    // 4 L2CAP = 251) and was the first size to complete a handshake on hardware.
    const l = endpoint.addLink('central', cappedSegment(info.maxSegment))
    link = l
    for (const segment of early.splice(0)) l.onSegment(segment)

    const canWithoutResponse = typeof rx.writeValueWithoutResponse === 'function' &&
      rx.properties?.writeWithoutResponse !== false
    let withResponse = !canWithoutResponse
    ;(async () => {
      let failures = 0
      for (;;) {
        const segment = await l.nextSegment()
        if (segment === undefined) break
        if (!radioUp) continue
        try {
          await write(rx, segment, withResponse)
          failures = 0
        } catch (error) {
          // Never re-send: a failed write may still have arrived. QUIC recovers.
          failures += 1
          if ((error as { name?: string })?.name === 'NotSupportedError' && info.writeWithResponse) withResponse = true
          log(`bluetooth: RX write failed (${failures}): ${(error as Error)?.message ?? error}`)
          if (gatt.connected === false) onGone()
          else if (failures >= MAX_WRITE_FAILURES) l.onDisconnected()
        }
      }
      resolveDrained()
      dropGatt()
    })().catch(error => {
      log(`bluetooth: write loop failed: ${(error as Error)?.message ?? error}`)
      resolveDrained()
      l.onDisconnected()
      dropGatt()
    })

    const retry = setInterval(() => { l.retryHandshake() }, HELLO_RETRY_MS)
    let printerId: string
    try {
      l.retryHandshake()
      printerId = await withTimeout(l.connected(), options.helloTimeoutMs ?? HELLO_TIMEOUT_MS, 'The Bluetooth handshake')
    } finally {
      clearInterval(retry)
    }
    if (printerId.toLowerCase() !== info.endpointId) {
      throw new Error("The printer's INFO and HELLO name different printers.")
    }
    handle.printerId = info.endpointId
    handle.info = info
    owners.set(device, handle)
    log(`bluetooth: link up to ${printerId.slice(0, 10)}`)
    return handle
  } catch (error) {
    if (link?.isClosed()) {
      // The link closed itself (a BYE from the printer): let its BYE go out.
      await Promise.race([drained, sleep(DRAIN_MS)])
    }
    link?.onDisconnected()
    // dropGatt frees the device for another attempt.
    dropGatt()
    throw error
  }
}

/**
 * Printers the person asked to open over Bluetooth, by EndpointId: the
 * device to link, and the link once it is up. `iroh.ts` reads this when it
 * dials a printer, so a printer with no Wi-Fi opens over the radio and one
 * that is online keeps its one Bluetooth slot free.
 */
const routes = new Map<string, { device: BleDevice, link: BleLinkHandle | null }>()

export function useBluetoothFor (printerId: string, device: BleDevice) {
  const id = printerId.toLowerCase()
  const existing = routes.get(id)
  if (existing?.device === device) return
  existing?.link?.disconnect()
  routes.set(id, { device, link: null })
}

export function stopUsingBluetoothFor (printerId: string) {
  const id = printerId.toLowerCase()
  routes.get(id)?.link?.disconnect()
  routes.delete(id)
}

/**
 * The live link to `printerId`, opened on `endpoint` if the person asked for
 * Bluetooth and it is not up yet. `null` when they did not, or the endpoint
 * takes no Bluetooth links.
 */
export async function bluetoothRouteFor (endpoint: unknown, printerId: string, options?: OpenLinkOptions): Promise<BleLinkHandle | null> {
  const route = routes.get(printerId.toLowerCase())
  if (!route || !takesBleLinks(endpoint)) return null
  if (route.link?.isOpen()) return route.link
  route.link = await openBleLink(endpoint, route.device, options)
  if (route.link.printerId !== printerId.toLowerCase()) {
    await route.link.disconnect()
    route.link = null
    throw new Error('The printer nearby is not the one asked for.')
  }
  return route.link
}
