import { describe, expect, it, test } from 'vitest'
import { diskUse, frequency, latest, networkLines, osName, serviceState } from '../model'

describe('a service', () => {
  test.each([
    ['active', 'running', 'Running', 'ok'],
    ['active', 'exited', 'Exited', 'ok'],
    ['activating', 'start', 'Starting', 'run'],
    ['failed', 'failed', 'Failed', 'err'],
    ['inactive', 'dead', 'Stopped', 'off']
  ])('%s (%s) is %s', (active, sub, text, tone) => {
    expect(serviceState(active, sub)).toEqual({ text, tone })
  })
})

describe('the host', () => {
  it('names the OS, leaving out a version in the name\'s place and using the id for #', () => {
    expect(osName({ name: 'Debian GNU/Linux', release_info: { version_id: '12' } })).toBe('Debian GNU/Linux 12')
    expect(osName({ name: '#MuonOS', id: 'muonos' })).toBe('muonos')
    expect(osName({ name: '0.3.1' })).toBeNull()
    expect(osName(undefined)).toBeNull()
  })

  it('lists each interface with its IPv4 addresses, or IPv6 when it has no IPv4', () => {
    expect(networkLines({
      wlan0: { ip_addresses: [{ family: 'ipv4', address: '192.168.1.153' }, { family: 'ipv6', address: 'fe80::1' }] },
      eth0: { ip_addresses: [{ family: 'ipv6', address: 'fe80::2' }] },
      ap0: {}
    })).toEqual(['wlan0 · 192.168.1.153', 'eth0 · fe80::2', 'ap0'])
  })

  test.each([[520_000_000, '520 MHz'], [1_800_000_000, '1.8 GHz'], [12_000, '12 kHz']])('%d Hz is %s', (hz, text) => {
    expect(frequency(hz)).toBe(text)
  })
})

describe('the disk', () => {
  const size = (b: number) => `${Math.round(b / 1e9)} GB`

  it('says how full it is', () => {
    expect(diskUse({ total: 29e9, used: 6e9, free: 23e9 }, size)).toEqual({ share: 6 / 29, text: '6 GB of 29 GB used · 23 GB free' })
  })

  it('works out what Moonraker leaves out', () => {
    expect(diskUse({ total: 10e9, free: 4e9 }, size)?.text).toBe('6 GB of 10 GB used · 4 GB free')
    expect(diskUse({}, size)).toBeNull()
  })
})

describe('usage', () => {
  it('reads the latest point, which the chart store keeps as a string', () => {
    expect(latest([{ load: '0.40' }, { load: '1.25' }], 'load')).toBe(1.25)
    expect(latest([], 'load')).toBeNull()
    expect(latest([{ load: 'x' }], 'load')).toBeNull()
  })
})
