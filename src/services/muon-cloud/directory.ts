/**
 * The printer list in the side panel: one entry per printer, in three groups.
 *
 * - **Cloud**: the printers linked to the signed-in account. The account keeps
 *   them, so they list whether or not this browser can see them now. One that
 *   is also on this network can be opened locally from its card.
 * - **Local**: printers saved in this browser that are not in the account. A
 *   saved printer that turns out to be in the account lists under Cloud only.
 * - **Discovery**: what is on this network or nearby now and in neither group.
 *
 * One printer is one entry, however many ways it is seen. The join key is the
 * Iroh EndpointId: the service names a printer by it, `/server/muon/identity`
 * publishes it (KAN-403), and the Bluetooth advertisement starts with it. An
 * address is only a fallback for software that predates the field, and a name
 * is the last resort, as in `searchRows`.
 */
import type { InstanceConfig } from '@/store/config/types'
import { Globals } from '@/globals'
import { isPrinter, type NearbyPrinter } from '@/services/muon-ble/nearby'
import type { CloudPrinter } from './api'
import type { PrinterStatus } from './state'
import {
  lanAddresses,
  sameExactName,
  sameLanPrinter,
  type CloudNearbyPrinter,
  type LanHealth,
  type LanPrinter
} from './discovery'
import { searchRows, type SearchRow } from './searchRows'

/**
 * What the status icon says:
 * - `online`: it answered, and Klipper is ready.
 * - `printing`, `paused`: as Klipper says.
 * - `connecting`: being reached now.
 * - `searching`: no answer yet, and the search is still running.
 * - `offline`: no answer.
 * - `error`: it answered, and Klipper is not ready, or the connection failed.
 * - `locked`: it answered, and wants a sign-in or refuses this browser.
 * - `available`: found, and its state was not read (Discovery rows).
 */
export type PrinterHealth =
  'online' | 'printing' | 'paused' | 'connecting' | 'searching' | 'offline' | 'error' | 'locked' | 'available'

export type DirectorySection = 'cloud' | 'local' | 'found'

/** Who the printer is linked to, as far as this browser knows. */
export type LinkedTo = 'mine' | 'other' | 'none' | 'unknown'

export interface DirectoryEntry {
  key: string;
  section: DirectorySection;
  name: string;
  endpointId: string | null;
  health: PrinterHealth;
  /** The line under the name. */
  detail: string;
  /** Its address on this network now, when it answered on one. */
  host: string | null;
  /** Which connection Fluidd is showing it through now. */
  active: 'cloud' | 'local' | null;
  linkedTo: LinkedTo;
  cloud?: CloudPrinter;
  /** Saved entries for this printer. More than one when it was saved at several addresses. */
  saved: InstanceConfig[];
  lan?: LanPrinter;
  /** Heard over Bluetooth. */
  nearby?: NearbyPrinter;
  /** Discovery only: the row the welcome page would show, with its action. */
  row?: SearchRow;
}

/** The printer Fluidd is connected to locally, read from its own socket. */
export interface LocalLive {
  apiUrl: string;
  health: PrinterHealth;
  detail: string;
}

export interface DirectorySources {
  account: CloudPrinter[];
  status: Record<string, PrinterStatus>;
  email: string | null;
  /** Saved local printers, without the cloud placeholder. */
  saved: InstanceConfig[];
  found: LanPrinter[];
  cloudNearby: CloudNearbyPrinter[];
  nearby: NearbyPrinter[];
  activeCloudId: string | null;
  /** Null while a cloud printer is shown. */
  local: LocalLive | null;
  /** The search is still running, so a printer with no answer may yet answer. */
  searching: boolean;
}

export interface Directory {
  cloud: DirectoryEntry[];
  local: DirectoryEntry[];
  found: DirectoryEntry[];
}

/**
 * A saved printer's name: the one it was given, else its network name
 * (muon-boxwood-367a), else its address. Fluidd's own default, "fluidd", is
 * no name, as getDisplayName treats it.
 */
export function savedName (s: InstanceConfig): string {
  const name = (s.name ?? '').trim()
  if (name && name !== Globals.APP_NAME) return name
  if (s.mdnsHost) return s.mdnsHost.replace(/\.local\.?$/i, '')
  return hostOf(s.apiUrl)
}

export function hostOf (url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

function lanAt (found: LanPrinter[], host: string): LanPrinter | undefined {
  return found.find(l => lanAddresses(l).includes(host))
}

/** The LAN printer a saved entry is: by EndpointId, else by address. */
function lanForSaved (found: LanPrinter[], s: InstanceConfig): LanPrinter | undefined {
  if (s.endpointId) {
    const byId = found.find(l => l.endpointId === s.endpointId)
    if (byId) return byId
  }
  const byHost = lanAt(found, hostOf(s.apiUrl))
  // A saved EndpointId and a different one at that address: someone else's printer took the address.
  if (byHost && s.endpointId && byHost.endpointId && byHost.endpointId !== s.endpointId) return undefined
  if (byHost || s.endpointId) return byHost
  // Saved before entries recorded the EndpointId, and gone from its address:
  // the display name, serial suffix and all, is the only thing left to go by.
  return found.find(l => sameExactName(l.name, s.name))
}

function fromLanHealth (h: LanHealth | undefined): PrinterHealth {
  if (!h) return 'available'
  return h.state === 'ready' ? 'online' : h.state
}

export function healthLabel (h: PrinterHealth): string {
  switch (h) {
    case 'online': return 'Online'
    case 'printing': return 'Printing'
    case 'paused': return 'Paused'
    case 'connecting': return 'Connecting…'
    case 'searching': return 'Looking for it…'
    case 'offline': return 'Offline'
    case 'error': return 'Error'
    case 'locked': return 'Needs access'
    case 'available': return 'On this network'
  }
}

/** A cloud printer's state, from the service's online flag and its status reads over Iroh. */
export function cloudHealth (online: boolean, s: PrinterStatus | undefined): PrinterHealth {
  if (!online) return 'offline'
  if (!s) return 'connecting'
  if (!s.reachable) return s.error === 'offline' ? 'offline' : 'error'
  if (s.state === 'printing') return 'printing'
  if (s.state === 'paused') return 'paused'
  if (s.state === 'error' || s.state?.startsWith('klipper')) return 'error'
  return 'online'
}

function linkedFrom (lan: LanPrinter | undefined, email: string | null): LinkedTo {
  if (!lan) return 'unknown'
  const { phase, account } = lan.link
  if (phase === 'linked') return account && email && account === email ? 'mine' : 'other'
  if (phase === 'unlinked' || phase === 'code' || phase === 'failed') return 'none'
  return 'unknown'
}

function lanDetail (lan: LanPrinter): string {
  const h = lan.health
  const state = h ? (h.message ?? healthLabel(fromLanHealth(h))) : 'On this network'
  return `${state} · ${lan.host}`
}

export function printerDirectory (src: DirectorySources): Directory {
  const claimedLan = new Set<LanPrinter>()
  const claimedSaved = new Set<InstanceConfig>()
  const claimedNearby = new Set<NearbyPrinter>()
  const activeLocal = src.local?.apiUrl ?? null

  const nearbyFor = (endpointId: string | null) => {
    if (!endpointId) return undefined
    const p = src.nearby.find(n => !claimedNearby.has(n) && isPrinter(n, endpointId))
    if (p) claimedNearby.add(p)
    return p
  }

  const cloud: DirectoryEntry[] = src.account.map(c => {
    const lan = src.found.find(l => !claimedLan.has(l) && sameLanPrinter(l, c.id, c.name))
    if (lan) claimedLan.add(lan)
    const saved = src.saved.filter(s =>
      s.endpointId === c.id || (!!lan && lanForSaved([lan], s) === lan))
    saved.forEach(s => claimedSaved.add(s))
    const localActive = !!activeLocal && saved.some(s => s.apiUrl === activeLocal)
    const active = src.activeCloudId === c.id ? 'cloud' : localActive ? 'local' : null
    const status = src.status[c.id]
    let health = cloudHealth(c.online, status)
    let detail = cloudDetail(c.online, status)
    if (active === 'local' && src.local) {
      health = src.local.health
      detail = `${src.local.detail} · connected locally`
    } else if (lan && health === 'offline') {
      // The service lost it, and it is right here.
      health = fromLanHealth(lan.health)
      detail = `${lanDetail(lan)} · on this network`
    } else if (lan) {
      detail = `${detail} · on this network`
    }
    return {
      key: `cloud:${c.id}`,
      section: 'cloud',
      name: c.name,
      endpointId: c.id,
      health,
      detail,
      host: lan?.host ?? null,
      active,
      linkedTo: 'mine',
      cloud: c,
      saved,
      lan,
      nearby: nearbyFor(c.id)
    }
  })

  const local: DirectoryEntry[] = []
  for (const s of src.saved) {
    if (claimedSaved.has(s)) continue
    const lan = lanForSaved(src.found, s)
    const endpointId = s.endpointId ?? lan?.endpointId ?? null
    // Saved twice (an address and a name, or two addresses): one entry.
    const same = local.find(e =>
      (!!endpointId && e.endpointId === endpointId) || (!!lan && e.lan === lan))
    if (same) {
      same.saved.push(s)
      if (s.apiUrl === activeLocal) same.active = 'local'
      continue
    }
    if (lan) claimedLan.add(lan)
    const active = s.apiUrl === activeLocal ? 'local' : null
    let health: PrinterHealth
    let detail: string
    if (active && src.local) {
      health = src.local.health
      detail = src.local.detail
    } else if (lan) {
      health = fromLanHealth(lan.health)
      detail = lanDetail(lan)
    } else {
      health = src.searching ? 'searching' : 'offline'
      detail = src.searching ? 'Looking for it on this network…' : 'Not found on this network'
    }
    local.push({
      key: `local:${s.apiUrl}`,
      section: 'local',
      name: lan?.name ?? savedName(s),
      endpointId,
      health,
      detail,
      host: lan?.host ?? null,
      active,
      linkedTo: linkedFrom(lan, src.email),
      saved: [s],
      lan,
      nearby: nearbyFor(endpointId)
    })
  }
  // An entry whose active saved address was not the first one.
  for (const e of local) {
    if (e.active && src.local && e.health !== src.local.health) {
      e.health = src.local.health
      e.detail = src.local.detail
    }
  }

  const listedIds = new Set([...cloud, ...local].map(e => e.endpointId).filter((id): id is string => !!id))
  const rows = searchRows({
    found: src.found.filter(l => !claimedLan.has(l) && !(l.endpointId && listedIds.has(l.endpointId))),
    cloud: src.cloudNearby.filter(c =>
      !listedIds.has(c.printerId) &&
      ![...claimedLan].some(l => sameLanPrinter(l, c.printerId, c.name))),
    nearby: src.nearby.filter(n => !claimedNearby.has(n) && ![...listedIds].some(id => isPrinter(n, id))),
    // Account printers are listed already; Discovery shows only what is not.
    account: [],
    email: src.email
  })
  const found: DirectoryEntry[] = rows.map(row => {
    const linkedTo: LinkedTo = row.linked
      ? (row.lan ? linkedFrom(row.lan, src.email) : 'other')
      : row.lan || row.cloudId ? 'none' : 'unknown'
    return {
      key: `found:${row.key}`,
      section: 'found',
      name: row.name,
      endpointId: row.lan?.endpointId ?? row.cloudId ?? row.nearby?.endpointId ?? null,
      health: row.lan ? fromLanHealth(row.lan.health) : 'available',
      detail: row.meta,
      host: row.host,
      active: null,
      linkedTo,
      saved: [],
      lan: row.lan,
      nearby: row.nearby,
      row
    }
  })

  return { cloud, local, found }
}

/** The line under a cloud printer's name. */
export function cloudDetail (online: boolean, s: PrinterStatus | undefined): string {
  if (!online) return 'Offline'
  if (!s) return 'Connecting through Muon3D…'
  if (!s.reachable) return s.error === 'offline' ? 'Offline' : `Unreachable: ${s.error}`
  const state = (s.state ?? 'unknown').replace(/^\w/, c => c.toUpperCase())
  if (s.state === 'printing' || s.state === 'paused') {
    const percent = Math.round((s.progress ?? 0) * 100)
    return `${state} · ${percent}%${s.filename ? ` · ${s.filename}` : ''}`
  }
  return state
}

/**
 * Saved entries to bring up to date from what the search found: record the
 * EndpointId a saved printer published, and follow a printer saved at an IP
 * address to its new one. A printer saved by name keeps its name: mDNS follows
 * it already. The entry Fluidd is connected through is left alone.
 */
/**
 * What to change about saved printers, given what the search found: the
 * EndpointId they lacked, their `.local` name, and the address they answer at
 * now. `blocked` says this page may not reach IPv4 addresses, so a printer
 * saved by IP moves to the `.local` name it answered at.
 */
export function savedUpdates (saved: InstanceConfig[], found: LanPrinter[], blocked = false): Array<{ apiUrl: string, changes: Partial<InstanceConfig> }> {
  const updates: Array<{ apiUrl: string, changes: Partial<InstanceConfig> }> = []
  for (const s of saved) {
    if (s.active) continue
    const lan = lanForSaved(found, s)
    if (!lan?.endpointId) continue
    const changes: Partial<InstanceConfig> = {}
    if (!s.endpointId) changes.endpointId = lan.endpointId
    if (lan.mdnsHost && s.mdnsHost !== lan.mdnsHost) changes.mdnsHost = lan.mdnsHost
    const host = hostOf(s.apiUrl)
    const savedByIp = /^\d{1,3}(\.\d{1,3}){3}(:\d+)?$/.test(host)
    const ipNow = lanAddresses(lan).find(a => /^\d{1,3}(\.\d{1,3}){3}$/.test(a))
    const nameNow = lanAddresses(lan).find(a => a.endsWith('.local'))
    if (savedByIp && ipNow && !lanAddresses(lan).includes(host)) {
      changes.apiUrl = `http://${ipNow}`
      changes.socketUrl = `ws://${ipNow}/websocket`
    } else if (savedByIp && blocked && nameNow) {
      changes.apiUrl = `http://${nameNow}`
      changes.socketUrl = `ws://${nameNow}/websocket`
    }
    if (Object.keys(changes).length) updates.push({ apiUrl: s.apiUrl, changes })
  }
  return updates
}
