import { describe, expect, it } from 'vitest'
import {
  hash4,
  isPrinterSlug,
  slugForAddress,
  slugForCloudPrinter,
  slugForIdentity,
  slugForMdnsHost,
  slugify,
  slugSuffix
} from '../slug'

describe('printer slugs', () => {
  it('makes words from a display name', () => {
    expect(slugify('Boxwood · 367A')).toBe('boxwood-367a')
    expect(slugify('  Café Printer!! ')).toBe('cafe-printer')
  })

  it('names a Muon3D printer by its name and serial suffix', () => {
    expect(slugForIdentity({ name: 'boxwood', derived_name: 'boxwood', suffix: '367a' })).toBe('boxwood-367a')
    expect(slugForIdentity({ name: 'Workshop One', derived_name: 'boxwood', suffix: '367A' })).toBe('workshop-one-367a')
    expect(slugForIdentity({ name: 'Boxwood 367A', suffix: '367a' })).toBe('boxwood-367a')
    expect(slugForIdentity({ derived_name: 'walnut', suffix: '8987' })).toBe('walnut-8987')
    expect(slugForIdentity({ name: 'boxwood' })).toBeNull()
    expect(slugForIdentity(null)).toBeNull()
  })

  it('reads the same slug from the .local name', () => {
    expect(slugForMdnsHost('muon-boxwood-367a.local')).toBe('boxwood-367a')
    expect(slugForMdnsHost('Muon-walnut-8987.local')).toBe('walnut-8987')
    expect(slugForMdnsHost('boxwood.local')).toBeNull()
    expect(slugForMdnsHost(undefined)).toBeNull()
  })

  it("names an account printer by the console's display name", () => {
    expect(slugForCloudPrinter({ id: 'f1f6920f757634a1', name: 'Boxwood · 367A' })).toBe('boxwood-367a')
    // Renamed in the console without its suffix: four characters of the EndpointId.
    expect(slugForCloudPrinter({ id: 'f1f6920f757634a1', name: 'Workshop printer' })).toBe('workshop-printer-f1f6')
  })

  it('names any other printer by its name and a hash of its address', () => {
    const a = slugForAddress('Voron', 'http://192.168.1.20')
    expect(a).toMatch(/^voron-[a-z0-9]{4}$/)
    expect(slugForAddress('Voron', 'http://192.168.1.20/')).toBe(a)
    expect(slugForAddress('Voron', 'http://192.168.1.21')).not.toBe(a)
    // Fluidd's default instance name says nothing: the host does.
    expect(slugForAddress('fluidd', 'http://voron.local')).toMatch(/^voron-local-[a-z0-9]{4}$/)
  })

  it("never starts with a path the printer's nginx sends to Moonraker", () => {
    expect(slugForAddress('Printer', 'http://10.0.0.5')).toMatch(/^p-printer-[a-z0-9]{4}$/)
    expect(slugForIdentity({ name: 'server room', suffix: 'a1b2' })).toBe('p-server-room-a1b2')
    expect(slugForCloudPrinter({ id: 'abcd', name: 'Access 1' })).toBe('p-access-1-abcd')
  })

  it('always has the shape the router accepts, and Fluidd routes never do', () => {
    for (const slug of [
      slugForIdentity({ name: 'boxwood', suffix: '367a' }),
      slugForCloudPrinter({ id: 'ffff', name: '' }),
      slugForAddress('', 'http://[::1]:7125'),
      slugForAddress('a very long printer name that goes on and on and on forever', 'http://x')
    ]) {
      expect(isPrinterSlug(slug!)).toBe(true)
    }
    for (const route of ['jobs', 'console', 'link', 'join', 'setup', 'sign-in', 'fleet', 'welcome', 'settings', 'slicer', 'icons']) {
      expect(isPrinterSlug(route)).toBe(false)
    }
  })

  it('keeps the suffix, which a rename never changes', () => {
    expect(slugSuffix('workshop-one-367a')).toBe('367a')
    expect(hash4('x')).toHaveLength(4)
    expect(hash4('x')).toBe(hash4('x'))
  })
})
