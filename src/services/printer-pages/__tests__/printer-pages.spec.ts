import { afterEach, describe, expect, it } from 'vitest'
import type { InstanceConfig } from '@/store/config/types'
import {
  isPrintersOwnPage,
  preferSavedPrinterFor,
  printerPageNeedsLogin,
  printerPagesState,
  resolveSlug,
  samePageFor,
  slugForInstance,
  slugInPath,
  stepPrinter,
  type PrinterTarget
} from '..'

const instance = (apiUrl: string, extra: Partial<InstanceConfig> = {}): InstanceConfig => ({
  name: 'fluidd',
  apiUrl,
  socketUrl: apiUrl.replace(/^http/, 'ws') + '/websocket',
  active: false,
  ...extra
})

const local = (slug: string, apiUrl: string, extra: Partial<InstanceConfig> = {}): PrinterTarget =>
  ({ kind: 'local', slug, instance: instance(apiUrl, extra) })
const cloud = (slug: string, printerId: string): PrinterTarget => ({ kind: 'cloud', slug, printerId })

afterEach(() => {
  printerPagesState.learned = {}
  localStorage.clear()
})

describe("a saved printer's slug", () => {
  it('comes from its .local name, once Fluidd has seen it', () => {
    expect(slugForInstance(instance('http://192.168.1.153', { mdnsHost: 'muon-boxwood-367a.local' }))).toBe('boxwood-367a')
  })

  it('comes from what the printer said about itself, before anything else', () => {
    printerPagesState.learned = { 'http://192.168.1.153': 'workshop-one-367a' }
    expect(slugForInstance(instance('http://192.168.1.153/', { mdnsHost: 'muon-boxwood-367a.local' }))).toBe('workshop-one-367a')
  })

  it('is its name and a hash of its address otherwise', () => {
    expect(slugForInstance(instance('http://192.168.1.20', { name: 'Voron' }))).toMatch(/^voron-[a-z0-9]{4}$/)
  })
})

describe('the printer an address names', () => {
  const printers = [
    local('boxwood-367a', 'http://192.168.1.153'),
    cloud('boxwood-367a', 'f1f6'),
    cloud('walnut-8987', 'aa11'),
    local('voron-x1y2', 'http://192.168.1.20')
  ]

  it('is the exact one, and the saved one when this page may reach it', () => {
    expect(resolveSlug('boxwood-367a', printers)).toMatchObject({ kind: 'local', slug: 'boxwood-367a' })
    expect(resolveSlug('walnut-8987', printers)).toMatchObject({ kind: 'cloud', printerId: 'aa11' })
  })

  it('is the one with the same suffix after a rename', () => {
    expect(resolveSlug('workshop-one-367a', printers)).toMatchObject({ slug: 'boxwood-367a' })
  })

  it('is none when two different printers share the suffix, or nothing matches', () => {
    expect(resolveSlug('nothing-0000', printers)).toBeNull()
    const clash = [local('alpha-a1b2', 'http://10.0.0.1'), local('beta-a1b2', 'http://10.0.0.2')]
    expect(resolveSlug('gamma-a1b2', clash)).toBeNull()
  })
})

describe('the same page for another printer', () => {
  it('keeps the page, its query and its fragment', () => {
    expect(samePageFor({ params: { printer: 'boxwood-367a' }, fullPath: '/boxwood-367a/jobs?sort=name' }, 'walnut-8987'))
      .toBe('/walnut-8987/jobs?sort=name')
    expect(samePageFor({ params: { printer: 'boxwood-367a' }, fullPath: '/boxwood-367a' }, 'walnut-8987')).toBe('/walnut-8987')
    expect(samePageFor({ params: {}, fullPath: '/fleet' }, 'walnut-8987')).toBe('/walnut-8987')
  })
})

describe('the address on the first load', () => {
  it('names a printer by its first part', () => {
    expect(slugInPath('/boxwood-367a/jobs')).toBe('boxwood-367a')
    expect(slugInPath('/jobs')).toBeNull()
    expect(slugInPath('/')).toBeNull()
  })

  it('starts Fluidd on the saved printer it names', () => {
    const key = 'appInstances'
    localStorage.setItem(key, JSON.stringify([
      instance('http://192.168.1.153', { mdnsHost: 'muon-boxwood-367a.local', active: true }),
      instance('http://192.168.1.170', { mdnsHost: 'muon-walnut-8987.local' })
    ]))
    preferSavedPrinterFor('/walnut-8987/jobs', key)
    const saved: InstanceConfig[] = JSON.parse(localStorage.getItem(key)!)
    expect(saved.map(i => i.active)).toEqual([false, true])
  })

  it('leaves the saved printers alone when it names none of them', () => {
    const key = 'appInstances'
    const before = JSON.stringify([instance('http://192.168.1.153', { active: true })])
    localStorage.setItem(key, before)
    preferSavedPrinterFor('/walnut-8987', key)
    preferSavedPrinterFor('/jobs', key)
    expect(localStorage.getItem(key)).toBe(before)
  })
})

describe("a printer's own page (U2)", () => {
  it('is the page the printer Fluidd is on serves', () => {
    expect(isPrintersOwnPage('http://192.168.1.153', { origin: 'http://192.168.1.153', hostname: '192.168.1.153' })).toBe(true)
    expect(isPrintersOwnPage('http://muon-boxwood-367a.local', { origin: 'http://muon-boxwood-367a.local', hostname: 'muon-boxwood-367a.local' })).toBe(true)
  })

  it('is not the shared name, the console, or a page with no printer', () => {
    expect(isPrintersOwnPage('http://muon3d.local', { origin: 'http://muon3d.local', hostname: 'muon3d.local' })).toBe(false)
    expect(isPrintersOwnPage('http://192.168.1.153', { origin: 'https://app.muon3d.com', hostname: 'app.muon3d.com' })).toBe(false)
    expect(isPrintersOwnPage('https://muon-cloud.invalid', { origin: 'https://muon-cloud.invalid', hostname: 'muon-cloud.invalid' })).toBe(false)
    expect(isPrintersOwnPage('', { origin: 'http://x', hostname: 'x' })).toBe(false)
  })
})

describe('[ and ]', () => {
  const printers = [
    local('boxwood-367a', 'http://10.0.0.5'),
    cloud('boxwood-367a', 'p1'),
    cloud('walnut-8987', 'p2'),
    local('maple-1c04', 'http://10.0.0.7')
  ]

  it('step to the next printer and the one before, each printer once', () => {
    expect(stepPrinter('boxwood-367a', 1, printers)).toBe('walnut-8987')
    expect(stepPrinter('walnut-8987', -1, printers)).toBe('boxwood-367a')
  })

  it("follow the switcher's order: the account's printers, a linked one among them, then this browser's", () => {
    const linked = [local('maple-1c04', 'http://10.0.0.7'), local('boxwood-367a', 'http://10.0.0.5'), cloud('walnut-8987', 'p2'), cloud('boxwood-367a', 'p1')]
    expect(stepPrinter('walnut-8987', 1, linked)).toBe('boxwood-367a')
    expect(stepPrinter('boxwood-367a', 1, linked)).toBe('maple-1c04')
  })

  it('go round from the last to the first', () => {
    expect(stepPrinter('maple-1c04', 1, printers)).toBe('boxwood-367a')
    expect(stepPrinter('boxwood-367a', -1, printers)).toBe('maple-1c04')
  })

  it('do nothing with one printer', () => {
    expect(stepPrinter('boxwood-367a', 1, [local('boxwood-367a', 'http://10.0.0.5')])).toBeNull()
  })
})

describe('a printer opened by its address', () => {
  const on = (slug: string) => slug === 'walnut-8987'
  const page = { apiConnected: true, authenticated: false, routePrinter: 'walnut-8987', routeName: 'Jobs', printerIndependent: false }

  it('asks for its own login once it is on and wants one', () => {
    expect(printerPageNeedsLogin(page, on)).toBe(true)
  })

  it('asks nothing before it is on, while unreachable, or once signed in', () => {
    expect(printerPageNeedsLogin({ ...page, routePrinter: 'boxwood-367a' }, on)).toBe(false)
    expect(printerPageNeedsLogin({ ...page, apiConnected: false }, on)).toBe(false)
    expect(printerPageNeedsLogin({ ...page, authenticated: true }, on)).toBe(false)
  })

  it('leaves the login page and the pages that belong to no printer alone', () => {
    expect(printerPageNeedsLogin({ ...page, routeName: 'Login' }, on)).toBe(false)
    expect(printerPageNeedsLogin({ ...page, routePrinter: undefined, printerIndependent: true }, on)).toBe(false)
  })
})
