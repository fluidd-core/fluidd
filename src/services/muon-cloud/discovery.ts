/**
 * Finds Muon3D printers on the network this browser is on.
 *
 * A browser cannot browse mDNS, so this asks addresses directly. Every M1
 * answers `GET /server/muon/identity` on port 80. The search goes in order:
 * the printers Fluidd already knows, then the /24 networks those printers sit
 * on, then the common home networks whose gateway (.1 or .254) answers
 * quickly, then the Windows hotspot network.
 *
 * An address nobody holds and an address on a network the browser has no route
 * to both just time out, so only a gateway that answers says that a network is
 * there. On a Windows hotspot the gateway is this machine, and its firewall
 * drops the probe, so that network is swept without the check.
 *
 * The sweep is paced. Chromium slows down when it cancels many pending
 * connections at once. Above about 25 a second, later probes wait in its queue
 * past their own timeout, and a printer that answers in 60 ms is missed.
 * Measured on 2026-09-23: 64 probes at a time with a 3 s timeout found the
 * printer every time. At 0.8 s or 1.5 s it was missed.
 *
 * A page served over HTTPS may use plain HTTP and WebSockets on the LAN only
 * in Chromium, and only after the person allows "look for devices on your
 * local network". Chrome asks once, at the first local request. Measured on
 * 2026-09-24 in Chrome 153 from app.muon3d.com: fetch and ws:// to a private
 * address both worked, with or without `targetAddressSpace: 'local'`, so
 * Fluidd connects to a printer on the LAN from the HTTPS site as it does
 * from the printer's own page. The sweep still declares it. Other browsers
 * block those requests as mixed content, and the sweep finds nothing there.
 *
 * The Muon3D service fills that gap in any browser: it lists the printers
 * that connect to it from this browser's public address
 * (`refreshCloudNearby`), linked or not.
 */
import Vue from 'vue'
import store from '@/store'
import type { InstanceConfig } from '@/store/config/types'
import { cloudApi } from './api'
import { STATUS_QUERY, statusFrom, type PrinterStatus } from './status'

export interface LanLinkStatus {
  /**
   * muon-link's `LinkPhase`, plus two this browser adds: `unsupported` when
   * the printer's Moonraker has no `/server/muon/link` (its MuonOS predates the
   * account link), and `unreachable` when the status could not be read at all.
   */
  phase: 'unavailable' | 'unlinked' | 'connecting' | 'code' | 'offer' | 'linked' | 'failed' |
    'unsupported' | 'unreachable' | string;
  account?: string;
  code?: string;
  message?: string;
}

/** A printer the Muon3D service sees behind this browser's public address. */
export interface CloudNearbyPrinter {
  printerId: string;
  name: string;
  model: string;
  /** Some account has linked it: this one's, or another's. */
  linked: boolean;
  /** Its addresses on this network, for opening it locally. */
  localAddrs: string[];
}

export interface LanPrinter {
  /** The address the printer answered on last. */
  host: string;
  /**
   * Every address it answered on in this search: an IP, its name, its name
   * with `.local`. A saved printer matches on any of them.
   */
  aliases?: string[];
  /** What Fluidd connects to for this printer. */
  apiUrl: string;
  /** "Boxwood · 367A". */
  name: string;
  /**
   * The Iroh EndpointId it publishes (KAN-403), or null from older software.
   * The service names a printer by the same id, so this is what joins a
   * printer found here to the one in the account. It is a match key, not
   * proof: the Iroh handshake proves the key when the printer is opened
   * through the service.
   */
  endpointId: string | null;
  /**
   * Its own `.local` name, `muon-boxwood-367a.local`, worked out from what it
   * reports about itself. A guess until it answers there: a printer that
   * predates the naming rule (KAN-357) has another hostname.
   */
  mdnsHost?: string | null;
  link: LanLinkStatus;
  /** How it answered the last health check, when it was asked. */
  health?: LanHealth;
}

/**
 * A printer's state as read over the network:
 * - `ready`, `printing`, `paused`: Klipper is running.
 * - `error`: Klipper is shut down, in error or still starting.
 * - `locked`: it answered, but wants a sign-in or refused this browser.
 */
export interface LanHealth {
  state: 'ready' | 'printing' | 'paused' | 'error' | 'locked';
  message?: string;
  checkedAt: number;
  /**
   * Everything its card shows, read in the same request: the job, progress,
   * temperatures and what's loaded. Absent when the printer refused.
   */
  status?: PrinterStatus;
}

/** Networks worth trying when nothing else says where the printers are. */
const COMMON_NETWORKS = [
  '192.168.1', '192.168.0', '10.0.0', '192.168.4', '192.168.68', '192.168.86',
  '192.168.2', '192.168.10', '10.0.1', '172.20.10', '192.168.43', '10.42.0'
]

/** Windows Mobile Hotspot always uses this network, with this machine as .1. */
const WINDOWS_HOTSPOT_NETWORK = '192.168.137'

const PROBE_TIMEOUT_MS = 3000
const ADDRESS_TIMEOUT_MS = 8000
const GATEWAY_TIMEOUT_MS = 1500
const GATEWAY_ANSWERS_WITHIN_MS = 900
const CONCURRENCY = 64
const FRESH_FOR_MS = 60_000

export const discoveryState = Vue.observable({
  scanning: false,
  /** The network being swept now, for the progress line. */
  network: '' as string,
  found: [] as LanPrinter[],
  /** From the service, which works on an HTTPS page too. */
  cloud: [] as CloudNearbyPrinter[],
  cloudChecked: false,
  finishedAt: 0,
  /**
   * Set when this browser will not let this page reach printers by IP
   * address (`pageBlocksLanIpv4`), with the page's own printer by IP address
   * as the way round it.
   */
  blockedByPage: null as { ownUrl: string | null } | null
})

/** Letters and digits only, lower case: "Boxwood · 367A" and "Muon-boxwood-367a" both contain "boxwood367a". */
function nameKey (name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Whether two names are the same printer's display name, letter for letter
 * ("Boxwood · 367A" and "boxwood-367a"). Stricter than `sameNamedPrinter`:
 * the display name carries the serial suffix, so an exact match is safe
 * enough to tie an old saved entry with no EndpointId to its printer.
 */
export function sameExactName (a: string, b: string) {
  const x = nameKey(a)
  return !!x && x === nameKey(b)
}

/** Whether a printer found on the LAN is the same one the service reported. */
export function sameNamedPrinter (a: string, b: string) {
  const x = nameKey(a)
  const y = nameKey(b)
  return !!x && !!y && (x.includes(y) || y.includes(x))
}

/**
 * Whether a printer found on the LAN is the one the service names `printerId`
 * (also called `name`). The EndpointId decides when the printer published
 * one; the name is the fallback for software that predates it.
 */
export function sameLanPrinter (lan: LanPrinter, printerId: string, name: string) {
  if (lan.endpointId) return lan.endpointId === printerId
  return sameNamedPrinter(lan.name, name)
}

/** Asks the Muon3D service which printers, linked or not, share this browser's network. */
export async function refreshCloudNearby () {
  try {
    const { printers } = await cloudApi.nearby()
    discoveryState.cloud = printers.map(p => ({
      printerId: p.printer_id,
      name: p.name,
      model: p.model,
      linked: !!p.linked,
      localAddrs: p.local_addrs ?? []
    }))
    for (const p of discoveryState.cloud) foundThroughService(p).catch(() => {})
  } catch {
    discoveryState.cloud = []
  } finally {
    discoveryState.cloudChecked = true
  }
}

/**
 * Puts the address this browser can reach first. A printer reports every
 * address it holds, and that includes its own hotspot (10.42.0.1 on an M1),
 * which only a device joined to that hotspot can use. Measured on boxwood,
 * 2026-09-24: the hotspot address came first.
 */
async function reachableFirst (printer: CloudNearbyPrinter): Promise<string | null> {
  const answers = await Promise.all(printer.localAddrs.map(async host => {
    try {
      await getJson(`${apiUrlFor(host)}/server/muon/identity`, {}, 2500)
      return true
    } catch {
      return false
    }
  }))
  const i = answers.indexOf(true)
  if (i < 0) return null
  const current = discoveryState.cloud.find(c => c.printerId === printer.printerId)
  if (current && i > 0) {
    const addrs = [...printer.localAddrs]
    const [host] = addrs.splice(i, 1)
    current.localAddrs = [host, ...addrs]
  }
  return printer.localAddrs[i]
}

/**
 * A printer the service says shares this network, read at once rather than
 * when the sweep reaches its network (up to half a minute later): its card
 * then says what it is doing straight away (14 Oct 2026: Walnut, printing,
 * showed only its name until it was opened).
 */
async function foundThroughService (printer: CloudNearbyPrinter) {
  if (discoveryState.found.some(l => l.endpointId === printer.printerId)) return
  const host = printer.localAddrs.length > 1 ? await reachableFirst(printer) : printer.localAddrs[0]
  if (!host || discoveryState.found.some(l => l.endpointId === printer.printerId)) return
  const found = await probe(host)
  if (found) remember(found)
}

/**
 * A printer's own `.local` name from the parts `/server/muon/identity`
 * reports. The hostname is `Muon-<name>-<suffix>`, built from the serial by
 * the same rule as the name (KAN-357), so it stays put when the owner renames
 * the printer: `derived_name` is the serial's name, not the owner's.
 */
export function mdnsHostFor (identity: any): string | null {
  const name = typeof identity?.derived_name === 'string' ? identity.derived_name.trim().toLowerCase() : ''
  const suffix = typeof identity?.suffix === 'string' ? identity.suffix.trim().toLowerCase() : ''
  if (!/^[a-z]+$/.test(name) || !/^[0-9a-z]+$/.test(suffix)) return null
  return `muon-${name}-${suffix}.local`
}

/**
 * Whether this page was opened by a name (`muon-boxwood-367a.local`) over
 * plain HTTP. That name can resolve to the printer's global IPv6 address, and
 * Chrome then treats the page as public and refuses, before anything is sent,
 * every request it makes to a private IPv4 address, such as another printer's
 * (`ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`). Reaching the other printer
 * by its own `.local` name still works: public to public.
 */
export function pageOpenedByName (loc: { protocol: string, hostname: string } = location): boolean {
  if (loc.protocol !== 'http:') return false
  const host = loc.hostname
  return !isIpv4(host) && !host.includes(':') && !host.startsWith('[') && host !== 'localhost'
}

/** The page's own printer's private IPv4 address, from its Moonraker. */
async function ownIpv4 (): Promise<string | null> {
  try {
    const info = await getJson(`${location.origin}/machine/system_info`, {}, 2500)
    const network = info?.system_info?.network ?? {}
    const addresses: string[] = []
    for (const iface of Object.values<any>(network)) {
      for (const a of iface?.ip_addresses ?? []) {
        if (a?.family === 'ipv4' && !a.is_link_local && typeof a.address === 'string') addresses.push(a.address)
      }
    }
    return addresses.find(a => !OWN_HOTSPOT.test(a)) ?? addresses[0] ?? null
  } catch {
    return null
  }
}

/** A request the browser refused this fast was never sent. */
const REFUSED_WITHIN_MS = 250

let blockCheck: Promise<boolean> | null = null

/**
 * Whether this browser refuses this page every request to a private IPv4
 * address. Asked once, of the one printer certain to be there: the one that
 * served the page, at its own IPv4 address. Measured in Chrome 154 on
 * 2026-10-09: refused in 3-4 ms, while the same printer answered by name.
 */
export function pageBlocksLanIpv4 (): Promise<boolean> {
  if (!pageOpenedByName()) return Promise.resolve(false)
  blockCheck ??= (async () => {
    const ip = await ownIpv4()
    if (!ip) return false
    const started = performance.now()
    try {
      await getJson(`http://${ip}/server/muon/identity`, {}, 2500)
      return false
    } catch (error) {
      const blocked = error instanceof TypeError && performance.now() - started < REFUSED_WITHIN_MS
      if (blocked) discoveryState.blockedByPage = { ownUrl: `http://${ip}/` }
      return blocked
    }
  })()
  return blockCheck
}

/** Forgets the answer, for tests. */
export function resetPageBlockCheck () {
  blockCheck = null
  discoveryState.blockedByPage = null
}

let running: Promise<void> | null = null

function isIpv4 (host: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
}

function hostOf (url: string): string | null {
  try {
    return new URL(url).hostname || null
  } catch {
    return null
  }
}

/**
 * `fetch` for an address on the LAN. On an HTTPS page it declares the request
 * local, which Chromium's Local Network Access needs before it lets the
 * request through.
 */
export function lanFetch (url: string, init: RequestInit = {}): Promise<Response> {
  const local = location.protocol === 'https:' ? { targetAddressSpace: 'local' } : {}
  return fetch(url, { ...init, ...local } as RequestInit)
}

async function getJson (url: string, init: RequestInit = {}, timeout = PROBE_TIMEOUT_MS): Promise<any> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeout)
  try {
    const response = await lanFetch(url, { ...init, signal: controller.signal, cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const body = await response.json()
    return body?.result ?? body
  } finally {
    window.clearTimeout(timer)
  }
}

function apiUrlFor (host: string) {
  return `http://${host}`
}

/**
 * Reads a printer's link state through its own Moonraker.
 *
 * A 404 means the printer's software has no account link (`unsupported`).
 * Anything else that stops the read, such as a timeout, a refused connection
 * or the browser blocking the request, says nothing about the printer's
 * version (`unreachable`). Both used to read as `unavailable`, which told
 * people to update a printer that was already on the newest build.
 */
export async function lanLinkStatus (apiUrl: string): Promise<LanLinkStatus> {
  try {
    const s = await getJson(`${apiUrl}/server/muon/link`, {}, 3000)
    return s && typeof s.phase === 'string' ? s : { phase: 'unsupported' }
  } catch (error) {
    return { phase: error instanceof Error && error.message === 'HTTP 404' ? 'unsupported' : 'unreachable' }
  }
}

/** Asks one address whether it is a Muon3D printer. */
export async function probe (host: string, timeout = PROBE_TIMEOUT_MS): Promise<LanPrinter | null> {
  const apiUrl = apiUrlFor(host)
  let identity: any
  try {
    identity = await getJson(`${apiUrl}/server/muon/identity`, {}, timeout)
  } catch {
    return null
  }
  if (!identity || typeof identity !== 'object') return null
  const name = String(identity.display || identity.name || host)
  const endpointId = typeof identity.endpoint_id === 'string' && identity.endpoint_id ? identity.endpoint_id : null
  const mdnsHost = mdnsHostFor(identity)
  const [link, health] = await Promise.all([lanLinkStatus(apiUrl), printerHealth(apiUrl)])
  return { host, apiUrl, name, endpointId, mdnsHost, link, health: health ?? undefined }
}

/**
 * Reads Klipper's state through the printer's Moonraker. Null means nothing
 * answered. A printer that answers with 401 or 403 is there but `locked`:
 * it wants a password, or its access rules refuse this browser.
 */
export async function printerHealth (apiUrl: string, timeout = PROBE_TIMEOUT_MS): Promise<LanHealth | null> {
  const checkedAt = Date.now()
  try {
    const result = await getJson(`${apiUrl}${STATUS_QUERY}`, {}, timeout)
    const webhooks = result?.status?.webhooks ?? {}
    const job = result?.status?.print_stats?.state
    const status: PrinterStatus = { reachable: true, ...statusFrom(result?.status ?? {}), updatedAt: checkedAt }
    if (webhooks.state !== 'ready') {
      return { state: 'error', message: webhooks.state_message || `Klipper ${webhooks.state ?? 'not running'}`, checkedAt, status }
    }
    if (job === 'printing') return { state: 'printing', checkedAt, status }
    if (job === 'paused') return { state: 'paused', checkedAt, status }
    if (job === 'error') return { state: 'error', message: 'The last print stopped with an error', checkedAt, status }
    return { state: 'ready', checkedAt, status }
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'HTTP 401' || message === 'HTTP 403') return { state: 'locked', checkedAt }
    // Moonraker answers 503 while Klippy has not connected.
    if (/^HTTP 5\d\d$/.test(message)) return { state: 'error', message: 'Klipper is not running', checkedAt }
    return null
  }
}

/**
 * What a person types into the address box: an IP address, a name such as
 * `muon-boxwood-367a`, the same with `.local`, or a full URL. A bare name is
 * tried as typed, then with `.local`, because the printer always answers
 * mDNS but only some routers know its name.
 */
export function addressCandidates (input: string): string[] {
  const host = input.trim()
    .replace(/^[a-z]+:\/\//i, '')
    .replace(/\/.*$/, '')
  if (!host) return []
  const bare = !host.includes('.') && !host.includes(':') && host.toLowerCase() !== 'localhost'
  return bare ? [host, `${host}.local`] : [host]
}

/**
 * Finds the printer behind what someone typed: the first candidate that
 * answers as a Muon3D printer. The wait is longer than the sweep's, because a
 * sweep running at the same time holds Chromium's connections.
 */
export async function probeAddress (input: string): Promise<LanPrinter | null> {
  for (const host of addressCandidates(input)) {
    const printer = await probe(host, ADDRESS_TIMEOUT_MS)
    if (printer) return printer
  }
  return null
}

/**
 * Whether this page may talk to the printer at `apiUrl` at all.
 *
 * A page served over HTTPS (control.muon3d.com) asking a plain-HTTP printer is
 * mixed content. Chromium lets it through once the person allows local network
 * access; other browsers, and a refused prompt, block it before it leaves the
 * machine. Fluidd's own connect does not report that: it saves the address,
 * points itself at it and shows a dashboard that never loads. Asking first lets
 * a blocked printer leave Fluidd where it was, with nothing saved.
 *
 * Any HTTP answer, even an error status, means the page can reach it.
 */
export async function pageCanReach (apiUrl: string, timeout = PROBE_TIMEOUT_MS): Promise<boolean> {
  return await pageReach(apiUrl, timeout) === 'reached'
}

/**
 * What became of this page's request to the printer at `apiUrl`: it was
 * answered, the browser blocked it, or it went out and nothing answered.
 *
 * Telling the last two apart decides what Fluidd may say. A blocked printer
 * still works from its own page; a silent address is wrong or the printer is
 * off, and its page would not load either. On 27 Oct Control told Jack the
 * browser blocked Boxwood and sent him to http://10.42.0.1/, an address the
 * printer had stopped holding hours before.
 *
 * A block comes back at once. A request the browser let out, to an address
 * nobody holds, waits for the time limit. With Chromium's local network
 * permission granted, a quick failure at a private IPv4 address is a refusal
 * from the address itself; at a name it may still be a block (a name can
 * resolve to a public IPv6 address). While Chromium's prompt is open the
 * request waits for the person, whatever the address: that is `asking`.
 */
export async function pageReach (apiUrl: string, timeout = PROBE_TIMEOUT_MS): Promise<'reached' | 'blocked' | 'asking' | 'silent'> {
  if (location.protocol !== 'https:' || !apiUrl.startsWith('http:')) return 'reached'
  const controller = new AbortController()
  let timedOut = false
  const timer = window.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeout)
  try {
    await lanFetch(`${apiUrl.replace(/\/+$/, '')}/server/info`, { mode: 'no-cors', signal: controller.signal, cache: 'no-store' })
    return 'reached'
  } catch {
    const permission = await localNetworkPermission()
    if (permission === 'prompt') return 'asking'
    if (timedOut || (permission === 'granted' && isPrivateIpv4(hostOf(apiUrl)))) return 'silent'
    return 'blocked'
  } finally {
    window.clearTimeout(timer)
  }
}

function isPrivateIpv4 (host: string | null): boolean {
  return !!host && isIpv4(host) && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
}

/**
 * Chromium's "look for devices on your local network" permission for this
 * page, or `unknown` where the browser has none (Firefox, Safari).
 */
export async function localNetworkPermission (): Promise<PermissionState | 'unknown'> {
  for (const name of ['local-network-access', 'local-network']) {
    try {
      return (await navigator.permissions.query({ name } as unknown as PermissionDescriptor)).state
    } catch { /* not this name, or no Permissions API */ }
  }
  return 'unknown'
}

/** The subnet an M1's own hotspot hands out (NetworkManager's shared mode). */
const OWN_HOTSPOT = /^10\.42\.0\.\d+$/

/** Whether `host` is an address on an M1's own hotspot. */
export function isOwnHotspot (host: string | null | undefined): boolean {
  return !!host && OWN_HOTSPOT.test(host)
}

/**
 * The address to open a printer the service found nearby at, or null when it
 * reported none this browser could use. The printer reports every private
 * IPv4 address it holds, sorted, and while its hotspot is up that includes
 * 10.42.0.1, which sorts first and which nobody on the owner's network can
 * reach.
 *
 * The hotspot address is never the answer, even alone. The service lists a
 * printer only while it connects from this browser's public address, so the
 * printer is on a network with this browser, and a report of the hotspot alone
 * is out of date. Boxwood, 27 Oct: its hotspot went down at 21:29:42, a second
 * after it joined the home Wi-Fi, and at 00:30 the service still gave
 * 10.42.0.1 as its only address.
 */
export function nearbyHost (localAddrs: string[]): string | null {
  return localAddrs.find(a => !isOwnHotspot(a)) ?? null
}

/** Whether something answered at `host` quickly. A refusal is an answer. */
async function answersQuickly (host: string): Promise<boolean> {
  const controller = new AbortController()
  const started = performance.now()
  const timer = window.setTimeout(() => controller.abort(), GATEWAY_TIMEOUT_MS)
  try {
    await lanFetch(`http://${host}/`, { mode: 'no-cors', signal: controller.signal, cache: 'no-store' })
    return true
  } catch {
    return performance.now() - started < GATEWAY_ANSWERS_WITHIN_MS
  } finally {
    window.clearTimeout(timer)
  }
}

/** Every address a found printer answered on. */
export function lanAddresses (printer: LanPrinter): string[] {
  return printer.aliases?.length ? printer.aliases : [printer.host]
}

function remember (printer: LanPrinter) {
  // One row per printer: the same EndpointId at another address is the same
  // printer, and keeps both addresses.
  const i = discoveryState.found.findIndex(p =>
    lanAddresses(p).includes(printer.host) || (!!printer.endpointId && p.endpointId === printer.endpointId))
  if (i < 0) {
    discoveryState.found.push({ ...printer, aliases: [printer.host] })
    return
  }
  const aliases = [...new Set([...lanAddresses(discoveryState.found[i]), printer.host])]
  discoveryState.found.splice(i, 1, { ...printer, aliases })
}

/** An address stopped answering. The printer leaves the list when none of its addresses answer. */
function forget (host: string) {
  const i = discoveryState.found.findIndex(p => lanAddresses(p).includes(host))
  if (i < 0) return
  const printer = discoveryState.found[i]
  const aliases = lanAddresses(printer).filter(a => a !== host)
  if (!aliases.length) discoveryState.found.splice(i, 1)
  else discoveryState.found.splice(i, 1, { ...printer, aliases, host: printer.host === host ? aliases[0] : printer.host })
}

async function pool<T> (items: T[], work: (item: T) => Promise<void>) {
  let next = 0
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++]
      await work(item)
    }
  })
  await Promise.all(runners)
}

/**
 * The addresses of the printers already saved. On a page that may not reach
 * IPv4 addresses, a printer saved by IP is asked at its `.local` name instead,
 * so it can be found there, and moved there, by its EndpointId.
 */
export function knownHosts (blocked = !!discoveryState.blockedByPage): string[] {
  const instances: InstanceConfig[] = store.getters['config/getInstances'] ?? []
  const hosts = instances.map(i => {
    const host = hostOf(i.apiUrl)
    return blocked && host && isIpv4(host) ? (i.mdnsHost ?? null) : host
  }).filter((h): h is string => !!h && !h.endsWith('.invalid'))
  if (isIpv4(location.hostname) && location.hostname !== '127.0.0.1') hosts.push(location.hostname)
  return [...new Set(hosts)]
}

async function sweep () {
  discoveryState.scanning = true
  try {
    const blocked = await pageBlocksLanIpv4()
    const known = knownHosts(blocked)
    discoveryState.network = 'printers you have added'
    await pool(known, async host => {
      const printer = await probe(host)
      if (printer) remember(printer)
    })
    // Every probe of an IPv4 address would be refused before it was sent, and
    // each refusal would read as a gateway answering.
    if (blocked) return

    const own = [...new Set(known.filter(isIpv4).map(h => h.split('.').slice(0, 3).join('.')))]
    discoveryState.network = 'this network'
    const answering = new Set<string>()
    await pool(COMMON_NETWORKS.filter(n => !own.includes(n)), async network => {
      const [first, last] = await Promise.all([answersQuickly(`${network}.1`), answersQuickly(`${network}.254`)])
      if (first || last) answering.add(network)
    })
    const networks = [...new Set([
      ...own,
      ...COMMON_NETWORKS.filter(n => answering.has(n)),
      WINDOWS_HOTSPOT_NETWORK
    ])]
    const seen = new Set(discoveryState.found.flatMap(lanAddresses))
    const hosts: string[] = []
    for (const network of networks) {
      for (let i = 1; i < 255; i++) {
        const host = `${network}.${i}`
        if (!seen.has(host)) hosts.push(host)
      }
    }
    await pool(hosts, async host => {
      discoveryState.network = `${host.slice(0, host.lastIndexOf('.'))}.x`
      const printer = await probe(host)
      if (printer) remember(printer)
    })
  } finally {
    discoveryState.scanning = false
    discoveryState.network = ''
    discoveryState.finishedAt = Date.now()
  }
}

/**
 * Searches the network, or returns the search already running. A search that
 * finished in the last minute is reused unless `force` is set. `nearby:
 * false` leaves out the console's list, for a caller that asked it already.
 */
export function discoverPrinters (force = false, { nearby = true }: { nearby?: boolean } = {}): Promise<void> {
  if (nearby) refreshCloudNearby().catch(() => {})
  if (running) return running
  if (!force && Date.now() - discoveryState.finishedAt < FRESH_FOR_MS) return Promise.resolve()
  running = sweep().finally(() => { running = null })
  return running
}

let refreshing: Promise<void> | null = null

/**
 * Asks again every printer already found, and every saved one, without the
 * sweep. A printer that stops answering leaves the list: the list says what
 * is on this network now, not what was once.
 */
export async function refreshKnownPrinters () {
  if (refreshing) return refreshing
  if (running) return
  const hosts = [...new Set([...discoveryState.found.flatMap(lanAddresses), ...knownHosts()])]
  refreshing = pool(hosts, async host => {
    const printer = await probe(host)
    if (printer) remember(printer)
    else forget(host)
  }).finally(() => { refreshing = null })
  return refreshing
}

let readingStatus: Promise<void> | null = null

/**
 * Reads again what the printers already found are doing, one request each:
 * a print's progress moves every few seconds, and the full check
 * (`refreshKnownPrinters`) runs only every 15.
 */
export function refreshLanStatus (): Promise<void> {
  if (readingStatus) return readingStatus
  readingStatus = Promise.all(discoveryState.found.map(async p => {
    const health = await printerHealth(p.apiUrl)
    if (!health) return
    const i = discoveryState.found.findIndex(f => f.apiUrl === p.apiUrl)
    if (i >= 0) discoveryState.found.splice(i, 1, { ...discoveryState.found[i], health })
  })).then(() => {}).finally(() => { readingStatus = null })
  return readingStatus
}

/** Refreshes the link state of the printers already found. */
export async function refreshLinkStates () {
  await Promise.all(discoveryState.found.map(async p => {
    remember({ ...p, link: await lanLinkStatus(p.apiUrl) })
  }))
}

/**
 * Asks a printer, through its own Moonraker, to start linking, so that its
 * screen shows a code. It does not read the code: linking takes the code as
 * read off the screen, which is the proof that someone is at the printer.
 *
 * Moonraker refuses a write without a JSON body (415), so this always sends
 * one. It answers with where the link stands: usually `connecting`, but
 * `offer` or `linked` when someone got there first. More than five asks a
 * minute from one address is a 429.
 */
export async function showLanCode (apiUrl: string): Promise<LanLinkStatus> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 5000)
  try {
    const response = await lanFetch(`${apiUrl}/server/muon/link/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: controller.signal
    })
    const body = await response.json().catch(() => null)
    if (response.status === 429) {
      throw new Error('The printer has been asked for a code too many times. Wait a minute, then try again.')
    }
    if (!response.ok) {
      throw new Error(body?.error?.message ?? `The printer refused to start linking (HTTP ${response.status}).`)
    }
    const status = body?.result ?? body
    return status && typeof status.phase === 'string' ? status : { phase: 'connecting' }
  } finally {
    window.clearTimeout(timer)
  }
}

/**
 * What to tell the person after asking a printer for a code. `error` is set
 * when there is nothing for them to type.
 */
export function lanCodeOutcome (name: string, status: LanLinkStatus): { note?: string, error?: string } {
  switch (status.phase) {
    case 'offer':
      return {
        note: `${name} is already asking on its screen whether to link to ${status.account || 'an account'}. ` +
          'Accept or decline it there.'
      }
    case 'linked':
      return { error: `${name} is already linked to an account. Its owner must unlink it first.` }
    default:
      return { note: `${name} is showing a code on its screen now. Type it below.` }
  }
}

/**
 * A Fluidd instance for a printer on the network. Connecting to it is a local
 * connection, open to anyone on the network: an open printer lets them
 * straight in, and one with a password asks for it.
 */
export function instanceForHost (host: string, name: string, endpointId?: string | null, mdnsHost?: string | null): InstanceConfig {
  return {
    name,
    apiUrl: apiUrlFor(host),
    socketUrl: `ws://${host}/websocket`,
    active: true,
    ...(endpointId ? { endpointId } : {}),
    ...(mdnsHost && mdnsHost !== host ? { mdnsHost } : {})
  }
}

/** A Fluidd instance for a printer the LAN search found. */
export function instanceFor (printer: LanPrinter): InstanceConfig {
  return instanceForHost(printer.host, printer.name, printer.endpointId, printer.mdnsHost)
}

/**
 * Whether a printer found on the LAN can show a link code now, and what to
 * tell the person when it cannot.
 */
export function lanLinkAvailability (link: LanLinkStatus): { canShow: boolean, note: string } {
  switch (link.phase) {
    case 'unlinked':
      return { canShow: true, note: 'not linked · show its code' }
    case 'code':
      return { canShow: true, note: 'showing a code on its screen now' }
    case 'failed':
      return { canShow: true, note: link.message ? `last try failed: ${link.message}` : 'last try failed · try again' }
    case 'connecting':
      return { canShow: false, note: 'getting a code from Muon3D…' }
    case 'offer':
      return { canShow: false, note: 'waiting for confirmation on its screen' }
    case 'linked':
      return { canShow: false, note: 'linked to an account · its owner must unlink it first' }
    case 'unsupported':
      return { canShow: false, note: 'its MuonOS does not include account linking yet' }
    case 'unavailable':
      return { canShow: false, note: 'not set up to link to a Muon3D account' }
    case 'unreachable':
      return { canShow: false, note: 'could not read its link status from this browser' }
    default:
      return { canShow: false, note: 'cannot link from here right now' }
  }
}
