/**
 * A page per printer (U1): /boxwood-367a, /boxwood-367a/jobs.
 *
 * The address names the printer and Fluidd shows that printer. Fluidd still
 * talks to one printer at a time (the store, the socket, the transport), so
 * an address for another printer opens it: a saved printer on this network
 * (`activateLocalPrinter`) or an account printer through Muon3D
 * (`activateCloudPrinter`). Opening a printer some other way moves the
 * address to its page.
 *
 * Slugs come from `./slug`. The printer Fluidd is on learns its own from
 * `/server/muon/identity` once it answers, so an address made before that
 * (from a saved IP, say) is corrected to the printer's real one.
 */
import Vue from 'vue'
import type VueRouter from 'vue-router'
import type { Route } from 'vue-router'
import store from '@/store'
import type { InstanceConfig } from '@/store/config/types'
import { httpClientActions } from '@/api/httpClientActions'
import { cloudState } from '@/services/muon-cloud/state'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'
import { mdnsHostFor } from '@/services/muon-cloud/discovery'
import { setActiveSlugSource, setForeignSlugSource } from '@/router/printerSlugSource'
import { foreignRegistry, foreignSlug } from '@/services/foreign-printers/registry'
import type { ForeignPrinterRecord } from '@/services/foreign-printers/types'
import {
  isPrinterSlug,
  slugForAddress,
  slugForCloudPrinter,
  slugForIdentity,
  slugForMdnsHost,
  slugSuffix
} from './slug'

export type PrinterTarget =
  | { kind: 'local', slug: string, instance: InstanceConfig }
  | { kind: 'cloud', slug: string, printerId: string }
  | { kind: 'foreign', slug: string, id: string }

function foreignTargets (): PrinterTarget[] {
  return knownPrinters().filter(target => target.kind === 'foreign')
}

export function foreignSlugForId (id: string): string | undefined {
  return foreignTargets().find(target => target.kind === 'foreign' && target.id === id)?.slug
}

export function isForeignSlug (slug: string | undefined): boolean {
  return !!slug && foreignTargets().some(target => target.slug === slug)
}

export function foreignRecordForSlug (slug: string | undefined): ForeignPrinterRecord | undefined {
  if (!slug) return undefined
  const target = foreignTargets().find(item => item.slug === slug)
  return target?.kind === 'foreign' ? foreignRegistry.records.find(record => record.id === target.id) : undefined
}

export const printerPagesState = Vue.observable({
  /** Local-printer slugs learned from `/server/muon/identity`, by API address. */
  learned: {} as Record<string, string>,
  /**
   * The address a printer had before its identity was known (from its IP:
   * 192-168-1-153-hzia), to the slug it learned (boxwood-367a). A page
   * opened in that moment keeps working, and is corrected to the real one.
   */
  aliases: {} as Record<string, string>,
  /** An address whose printer Fluidd could not find, to say so. */
  missing: null as string | null
})

const addressKey = (apiUrl: string) => apiUrl.replace(/\/+$/, '').toLowerCase()

/** The slug of a saved printer: learned, else from its .local name, its account entry, or its address. */
export function slugForInstance (instance: InstanceConfig): string {
  const learned = printerPagesState.learned[addressKey(instance.apiUrl)]
  if (learned) return learned
  const fromName = slugForMdnsHost(instance.mdnsHost)
  if (fromName) return fromName
  const account = instance.endpointId ? cloudState.printers.find(p => p.id === instance.endpointId) : undefined
  if (account) return slugForCloudPrinter(account)
  return slugForAddress(instance.name, instance.apiUrl)
}

function savedInstances (): InstanceConfig[] {
  return (store.state.config.instances as InstanceConfig[]).filter(i => !isManagedApiUrl(i.apiUrl))
}

/** Every printer this browser knows: saved ones, then account ones. */
export function knownPrinters (): PrinterTarget[] {
  const local: PrinterTarget[] = savedInstances().map(instance => ({ kind: 'local', slug: slugForInstance(instance), instance }))
  const cloud: PrinterTarget[] = cloudState.printers.map(p => ({
    kind: 'cloud',
    slug: slugForCloudPrinter(p),
    printerId: p.id
  }))
  const targets = [...local, ...cloud]
  const used = new Set(targets.map(target => target.slug))
  const foreign = foreignRegistry.records.map(record => {
    let slug = foreignSlug(record)
    let suffix = 1
    while (used.has(slug)) slug = slugForAddress(`${record.name} ${suffix++}`, `http://${record.host}`)
    used.add(slug)
    return { kind: 'foreign' as const, slug, id: record.id }
  })
  return [...targets, ...foreign]
}

/**
 * The printer an address names. An exact slug first; then, since a rename
 * changes only the words, the one printer whose slug has the same suffix.
 * A printer saved here wins over the same printer in the account when this
 * page may reach it (served by a printer, or plain http); an https page
 * (the console) opens it through Muon3D.
 */
export function resolveSlug (slug: string, printers: PrinterTarget[] = knownPrinters()): PrinterTarget | null {
  let matches = printers.filter(p => p.slug === slug)
  if (!matches.length) {
    const bySuffix = printers.filter(p => slugSuffix(p.slug) === slugSuffix(slug))
    // Saved and account entries with the same slug are one printer; two
    // slugs that share a suffix are two printers, and neither is guessed.
    if (new Set(bySuffix.map(p => p.slug)).size === 1) matches = bySuffix
  }
  if (!matches.length) return null
  const preferCloud = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const pick = (kind: PrinterTarget['kind']) => matches.find(m => m.kind === kind)
  return matches.find(target => target.kind === 'foreign') ??
    (preferCloud ? pick('cloud') ?? pick('local') : pick('local') ?? pick('cloud')) ?? null
}

/** The slug of the printer Fluidd is on now, or null with none. */
export function activeSlug (): string | null {
  const apiUrl: string = store.state.config.apiUrl
  if (!apiUrl) return null
  if (isManagedApiUrl(apiUrl)) {
    const id = cloudState.activePrinterId
    if (!id) return null
    const printer = cloudState.printers.find(p => p.id === id)
    return printer ? slugForCloudPrinter(printer) : null
  }
  const instance = savedInstances().find(i => addressKey(i.apiUrl) === addressKey(apiUrl))
  return instance ? slugForInstance(instance) : printerPagesState.learned[addressKey(apiUrl)] ?? slugForAddress('', apiUrl)
}

/** Whether `slug` is an address for the printer Fluidd is on now. */
export function isActiveSlug (slug: string): boolean {
  const active = activeSlug()
  if (!active) return false
  if (active === slug) return true
  // An address made before the printer's identity was known.
  if (printerPagesState.aliases[slug] === active) return true
  // A rename.
  return slugSuffix(active) === slugSuffix(slug) && resolveSlug(slug)?.slug === active
}

/**
 * The printer before or after `current`, for [ and ]: each printer once, in
 * the switcher's order, round from the last to the first. Null with fewer
 * than two.
 */
export function stepPrinter (current: string | null, direction: 1 | -1, printers: PrinterTarget[] = knownPrinters()): string | null {
  // The switcher lists the account's printers first (a linked one among
  // them), then those saved only in this browser.
  const ordered = [...printers.filter(p => p.kind === 'cloud'), ...printers.filter(p => p.kind !== 'cloud')]
  const slugs = [...new Set(ordered.map(p => p.slug))]
  if (slugs.length < 2) return null
  const at = current ? slugs.indexOf(current) : -1
  if (at === -1) return slugs[direction === 1 ? 0 : slugs.length - 1]
  return slugs[(at + direction + slugs.length) % slugs.length]
}

/** The printer's own page, or one of its pages (`jobs`, `settings`). */
export function printerPath (slug: string, page = ''): string {
  return page ? `/${slug}/${page.replace(/^\/+/, '')}` : `/${slug}`
}

/** The same page for another printer: /boxwood-367a/jobs → /walnut-8987/jobs. */
export function samePageFor (route: Pick<Route, 'params' | 'fullPath'>, slug: string): string {
  const current = route.params.printer
  if (!current) return printerPath(slug)
  return `/${slug}${route.fullPath.slice(current.length + 1)}`
}

/** Which printer Fluidd is on: its address, and for a cloud one its id. */
function printerOnNow (): string {
  const apiUrl: string = store.state.config.apiUrl ?? ''
  return isManagedApiUrl(apiUrl) ? `cloud:${cloudState.activePrinterId}` : addressKey(apiUrl)
}

/**
 * Asks the printer Fluidd is on for its identity and remembers its slug. A
 * printer that isn't a Muon3D one has none, and keeps its address-based slug.
 *
 * An answer that comes after a switch to another printer is dropped. It used
 * to be filed under the printer on by then: Boxwood's slug became another
 * name for Walnut, and Boxwood's address then opened Walnut's page.
 */
export async function learnActiveIdentity (timeout = 3000): Promise<string | null> {
  const apiUrl: string = store.state.config.apiUrl
  if (!apiUrl) return null
  const asked = printerOnNow()
  const before = activeSlug()
  try {
    const response = await httpClientActions.get<{ result: Record<string, unknown> }>('/server/muon/identity', { timeout })
    if (printerOnNow() !== asked) return null
    const identity = response.data?.result
    const slug = slugForIdentity(identity as any)
    if (!slug) return null
    // A hosted route is the complete account ID, never identity/display text.
    // Learning a name must not change what printer that route identifies.
    if (isManagedApiUrl(apiUrl)) return activeSlug()
    rememberAlias(before, slug)
    Vue.set(printerPagesState.learned, addressKey(apiUrl), slug)
    // Kept with the saved printer, so the next visit knows its slug at once.
    const mdnsHost = mdnsHostFor(identity)
    const endpointId = typeof identity?.endpoint_id === 'string' && identity.endpoint_id ? identity.endpoint_id : undefined
    const saved = savedInstances().find(i => addressKey(i.apiUrl) === addressKey(apiUrl))
    if (saved && ((mdnsHost && saved.mdnsHost !== mdnsHost) || (endpointId && saved.endpointId !== endpointId))) {
      store.commit('config/setUpdateInstanceName', {
        apiUrl: saved.apiUrl,
        ...(mdnsHost ? { mdnsHost } : {}),
        ...(endpointId ? { endpointId } : {})
      })
    }
    return slug
  } catch {
    return null
  }
}

/**
 * Keeps the address a printer had before it said who it is, as another name
 * for it. Never another printer's own address: that would make one
 * printer's page open the other.
 */
export function rememberAlias (before: string | null, learned: string) {
  if (!before || before === learned) return
  if (knownPrinters().some(t => t.slug === before && t.kind === 'cloud' && `cloud:${t.printerId}` !== printerOnNow())) return
  Vue.set(printerPagesState.aliases, before, learned)
}

/** The first path segment when it is a printer slug: what the address asks for. */
export function slugInPath (pathname: string): string | null {
  const first = pathname.split('/')[1] ?? ''
  return isPrinterSlug(first) ? first : null
}

/**
 * Before the first load: when the address names a saved printer, make it the
 * one Fluidd starts on, as if it had been the last one used.
 */
export function preferSavedPrinterFor (pathname: string, storageKey: string): void {
  const slug = slugInPath(pathname)
  if (!slug) return
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return
    const instances: InstanceConfig[] = JSON.parse(raw)
    const targets: PrinterTarget[] = instances
      .filter(i => !isManagedApiUrl(i.apiUrl))
      .map(instance => ({ kind: 'local', slug: slugForInstance(instance), instance }))
    const target = resolveSlug(slug, targets)
    if (target?.kind !== 'local') return
    for (const i of instances) i.active = i.apiUrl === target.instance.apiUrl
    localStorage.setItem(storageKey, JSON.stringify(instances))
  } catch { /* no storage, or not ours to parse */ }
}

let opening: string | null = null

/** How a printer is opened: `services/muon-cloud/activate`, handed in by main.ts. */
export interface PrinterOpeners {
  activateLocalPrinter: (instance: InstanceConfig) => Promise<boolean>
  activateCloudPrinter: (printerId: string) => Promise<void>
}

// Handed in rather than imported: activate.ts imports init.ts, which imports
// this module.
let openers: PrinterOpeners | null = null

/**
 * Opens the printer an address names, unless Fluidd is on it already.
 * Resolves false when no printer this browser knows has that slug.
 */
export async function openPrinterAt (slug: string): Promise<boolean> {
  if (isActiveSlug(slug)) {
    printerPagesState.missing = null
    return true
  }
  const target = resolveSlug(slug)
  if (!target) {
    printerPagesState.missing = slug
    return false
  }
  printerPagesState.missing = null
  if (opening === target.slug) return true
  opening = target.slug
  try {
    if (target.kind === 'foreign') return true
    if (!openers) return false
    if (target.kind === 'local') return await openers.activateLocalPrinter(target.instance)
    await openers.activateCloudPrinter(target.printerId)
    return true
  } finally {
    opening = null
  }
}

/**
 * Keeps the address and the printer together:
 * - an address for another printer opens that printer;
 * - an old address without a printer goes to the printer Fluidd is on;
 * - once the printer's identity is known, an address made before it is
 *   corrected to the real one.
 */
export function installPrinterPages (router: VueRouter, how: PrinterOpeners): void {
  openers = how
  setActiveSlugSource(activeSlug)
  setForeignSlugSource(isForeignSlug)

  router.afterEach((to) => {
    const slug = to.params.printer
    if (slug && !isActiveSlug(slug)) openPrinterAt(slug).catch(() => {})
  })
}

export interface LoginCheck {
  apiConnected: boolean;
  authenticated: boolean;
  /** The printer is reached through Muon3D, which never has Moonraker's login. */
  managed?: boolean;
  /** The printer the route names, if any. */
  routePrinter: string | undefined;
  routeName: string | null | undefined;
  printerIndependent: boolean;
}

/**
 * Whether the page on screen needs its printer's login. The route guard
 * lets a page for another printer in before that printer is on (it opens
 * after, in installPrinterPages), so the guard never asks that printer for
 * its password. Once it is on: connected, not signed in, and on its page.
 */
export function printerPageNeedsLogin (c: LoginCheck, isActive: (slug: string) => boolean = isActiveSlug): boolean {
  if (c.managed || !c.apiConnected || c.authenticated || c.printerIndependent) return false
  if (!c.routePrinter || c.routeName === 'Login') return false
  return isActive(c.routePrinter)
}

/** Replaces the address with the active printer's real slug, keeping the page. */
export function correctAddress (router: VueRouter): void {
  const route = router.currentRoute
  const slug = route.params.printer
  const active = activeSlug()
  if (!slug || !active || slug === active || !isActiveSlug(slug)) return
  router.replace(samePageFor(route, active)).catch(() => {})
}

/** Names a printer's page shares with every printer, so they open Printers (U2). */
const SHARED_HOSTS = new Set(['muon3d.local'])

/**
 * Whether this page is the printer's own page: served by the printer Fluidd
 * is on, at an address of its own. Its `/` opens that printer (U2).
 */
export function isPrintersOwnPage (apiUrl: string, location: Pick<Location, 'origin' | 'hostname'> = window.location): boolean {
  if (!apiUrl || isManagedApiUrl(apiUrl) || SHARED_HOSTS.has(location.hostname.toLowerCase())) return false
  try {
    return new URL(apiUrl).origin === location.origin
  } catch {
    return false
  }
}

/** The page of the printer Fluidd is on, or Printers with none. */
export function printerHomePath (): string {
  const slug = activeSlug()
  return slug ? printerPath(slug) : '/'
}
