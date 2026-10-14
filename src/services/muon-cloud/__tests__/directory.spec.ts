import { describe, expect, it } from 'vitest'
import { printerDirectory, savedUpdates, type DirectorySources } from '../directory'
import type { CloudPrinter } from '../api'
import type { CloudNearbyPrinter, LanPrinter } from '../discovery'
import type { InstanceConfig } from '@/store/config/types'

const BOXWOOD = 'f1f6920f'.repeat(8)
const WALNUT = '0658ae04'.repeat(8)
const CHURCHILL = 'c4c4c4c4'.repeat(8)

function lan (name: string, host: string, endpointId: string | null, fields: Partial<LanPrinter> = {}): LanPrinter {
  return {
    host,
    aliases: [host],
    apiUrl: `http://${host}`,
    name,
    endpointId,
    link: { phase: 'unlinked' },
    health: { state: 'ready', checkedAt: 1 },
    ...fields
  }
}

function saved (apiUrl: string, fields: Partial<InstanceConfig> = {}): InstanceConfig {
  const socketUrl = `${apiUrl.replace(/^http/, 'ws')}/websocket`
  return { name: 'Saved', apiUrl, socketUrl, active: false, ...fields }
}

function owned (id: string, name: string, online = true): CloudPrinter {
  return { id, name, model: 'M1', version: '1', linked_at: 0, last_seen: 0, online, online_since: null }
}

function nearbyCloud (printerId: string, name: string, linked: boolean, localAddrs: string[] = []): CloudNearbyPrinter {
  return { printerId, name, model: 'M1', linked, localAddrs }
}

function directory (sources: Partial<DirectorySources>) {
  return printerDirectory({
    account: [],
    status: {},
    email: 'jack@example.com',
    saved: [],
    found: [],
    cloudNearby: [],
    nearby: [],
    activeCloudId: null,
    local: null,
    searching: false,
    ...sources
  })
}

describe('one entry per printer', () => {
  it('lists Boxwood once, under Cloud, when it is linked, saved at an old address and found here', () => {
    // Jack's case of 2026-10-06: three Boxwood entries, one per way it was seen.
    const d = directory({
      account: [owned(BOXWOOD, 'Boxwood')],
      saved: [saved('http://192.168.1.153', { name: 'Boxwood', endpointId: BOXWOOD })],
      found: [lan('Boxwood · 367A', '192.168.137.88', BOXWOOD)],
      cloudNearby: [nearbyCloud(BOXWOOD, 'Boxwood', true, ['192.168.137.88'])]
    })
    expect(d.cloud).toHaveLength(1)
    expect(d.local).toHaveLength(0)
    expect(d.found).toHaveLength(0)
    expect(d.cloud[0]).toMatchObject({ host: '192.168.137.88', linkedTo: 'mine' })
    expect(d.cloud[0].saved).toHaveLength(1)
  })

  it('absorbs a saved entry with no EndpointId when the printer at its address is the cloud one', () => {
    const d = directory({
      account: [owned(BOXWOOD, 'Boxwood')],
      saved: [saved('http://192.168.137.88')],
      found: [lan('Boxwood · 367A', '192.168.137.88', BOXWOOD)]
    })
    expect(d.cloud).toHaveLength(1)
    expect(d.local).toHaveLength(0)
  })

  it('lists a saved printer once, at its address on this network, after it moved', () => {
    const d = directory({
      saved: [saved('http://192.168.1.37', { name: 'Walnut', endpointId: WALNUT })],
      found: [lan('Walnut · 8987', '192.168.137.32', WALNUT)]
    })
    expect(d.local).toHaveLength(1)
    expect(d.local[0]).toMatchObject({ host: '192.168.137.32', health: 'online', name: 'Walnut · 8987' })
    expect(d.found).toHaveLength(0)
  })

  it('lists the printer serving this page once, though it is saved by name and found by IP', () => {
    const page = saved('http://muon-boxwood-367a.local', { active: true })
    const found = lan('Boxwood · 367A', '192.168.137.88', BOXWOOD, { aliases: ['muon-boxwood-367a.local', '192.168.137.88'] })
    const d = directory({
      saved: [page],
      found: [found],
      local: { apiUrl: page.apiUrl, health: 'online', detail: 'Ready' }
    })
    expect(d.local).toHaveLength(1)
    expect(d.found).toHaveLength(0)
    expect(d.local[0]).toMatchObject({ active: 'local', health: 'online', endpointId: BOXWOOD })
  })

  it('ties an old saved entry with no EndpointId to its printer by its full display name, once its address is gone', () => {
    // Saved on the other Wi-Fi by a Fluidd that did not record EndpointIds.
    const d = directory({
      account: [owned(BOXWOOD, 'Boxwood')],
      saved: [saved('http://192.168.1.153', { name: 'Boxwood · 367A' })],
      found: [lan('Boxwood · 367A', '192.168.137.88', BOXWOOD)]
    })
    expect(d.cloud).toHaveLength(1)
    expect(d.local).toHaveLength(0)
    expect(savedUpdates([saved('http://192.168.1.153', { name: 'Boxwood · 367A' })], [lan('Boxwood · 367A', '192.168.137.88', BOXWOOD)]))
      .toEqual([{
        apiUrl: 'http://192.168.1.153',
        changes: { endpointId: BOXWOOD, apiUrl: 'http://192.168.137.88', socketUrl: 'ws://192.168.137.88/websocket' }
      }])
  })

  it('does not tie an old saved entry to a printer whose name only contains its name', () => {
    const d = directory({
      saved: [saved('http://192.168.1.153', { name: 'Boxwood' })],
      found: [lan('Boxwood · 367A', '192.168.137.88', BOXWOOD)]
    })
    expect(d.local[0]).toMatchObject({ name: 'Boxwood', health: 'offline' })
    expect(d.found).toHaveLength(1)
  })

  it('merges two saved entries for one printer', () => {
    const d = directory({
      saved: [
        saved('http://muon-walnut-8987.local', { endpointId: WALNUT }),
        saved('http://192.168.137.32', { endpointId: WALNUT })
      ],
      found: [lan('Walnut · 8987', '192.168.137.32', WALNUT)]
    })
    expect(d.local).toHaveLength(1)
    expect(d.local[0].saved).toHaveLength(2)
  })

  it('does not take another printer at a saved printer\'s old address for it', () => {
    const d = directory({
      saved: [saved('http://192.168.137.32', { name: 'Walnut', endpointId: WALNUT })],
      found: [lan('Churchill · 1A2B', '192.168.137.32', CHURCHILL)],
      searching: false
    })
    expect(d.local[0]).toMatchObject({ name: 'Walnut', health: 'offline', host: null })
    expect(d.found.map(e => e.name)).toEqual(['Churchill · 1A2B'])
  })
})

describe('a saved printer\'s name', () => {
  it('is the name it was given', () => {
    const d = directory({ saved: [saved('http://10.0.0.5', { name: 'Workshop' })] })
    expect(d.local[0].name).toBe('Workshop')
  })

  it('is its network name when it has only Fluidd\'s default', () => {
    const d = directory({ saved: [saved('http://10.0.0.5', { name: 'fluidd', mdnsHost: 'muon-boxwood-367a.local' })] })
    expect(d.local[0].name).toBe('muon-boxwood-367a')
  })

  it('is its address when it has neither', () => {
    const d = directory({ saved: [saved('http://10.0.0.5:7125', { name: 'fluidd' })] })
    expect(d.local[0].name).toBe('10.0.0.5:7125')
  })
})

describe('where each printer goes', () => {
  it('puts a printer found here and saved nowhere under Discovery', () => {
    const d = directory({ found: [lan('Churchill · 1A2B', '192.168.137.40', CHURCHILL)] })
    expect(d.found).toHaveLength(1)
    expect(d.found[0]).toMatchObject({ section: 'found', host: '192.168.137.40', linkedTo: 'none' })
    expect(d.found[0].row?.action).toBe('open')
  })

  it('says a printer under Discovery is linked to another account', () => {
    const walnut = lan('Walnut · 8987', '192.168.137.32', WALNUT, { link: { phase: 'linked', account: 'harry@example.com' } })
    const d = directory({ found: [walnut] })
    expect(d.found[0].linkedTo).toBe('other')
  })

  it('does not repeat an account printer the service sees nearby under Discovery', () => {
    const d = directory({
      account: [owned(BOXWOOD, 'Boxwood')],
      cloudNearby: [nearbyCloud(BOXWOOD, 'Boxwood', true, ['192.168.137.88'])]
    })
    expect(d.found).toHaveLength(0)
  })

  it('shows a saved printer that no longer answers as offline once the search is over', () => {
    const d = directory({ saved: [saved('http://192.168.1.37', { endpointId: WALNUT })] })
    expect(d.local[0]).toMatchObject({ health: 'offline', detail: 'Not found on this network' })
  })

  it('shows it as being looked for while the search runs', () => {
    const d = directory({ saved: [saved('http://192.168.1.37')], searching: true })
    expect(d.local[0].health).toBe('searching')
  })

  it('lists account printers whether or not they are here, because the account keeps them', () => {
    const d = directory({ account: [owned(BOXWOOD, 'Boxwood', false)] })
    expect(d.cloud[0]).toMatchObject({ health: 'offline', host: null })
  })
})

describe('health', () => {
  it('is green for a cloud printer that answered and is ready', () => {
    const d = directory({
      account: [owned(BOXWOOD, 'Boxwood')],
      status: { [BOXWOOD]: { reachable: true, state: 'standby', updatedAt: 1 } }
    })
    expect(d.cloud[0].health).toBe('online')
  })

  it('is connecting for an online cloud printer not read yet', () => {
    const d = directory({ account: [owned(BOXWOOD, 'Boxwood')] })
    expect(d.cloud[0].health).toBe('connecting')
  })

  it('is an error when Klipper is not ready', () => {
    const d = directory({
      found: [lan('Churchill', '192.168.137.40', CHURCHILL, { health: { state: 'error', message: 'Klipper shutdown', checkedAt: 1 } })]
    })
    expect(d.found[0].health).toBe('error')
  })

  it('takes the live socket for the printer Fluidd is on, through the cloud card it is under', () => {
    const page = saved('http://192.168.137.88', { endpointId: BOXWOOD, active: true })
    const d = directory({
      account: [owned(BOXWOOD, 'Boxwood')],
      saved: [page],
      local: { apiUrl: page.apiUrl, health: 'printing', detail: 'Printing · 40%' }
    })
    expect(d.cloud[0]).toMatchObject({ active: 'local', health: 'printing' })
  })

  it('reads a cloud printer the service lost from this network instead', () => {
    const d = directory({
      account: [owned(BOXWOOD, 'Boxwood', false)],
      found: [lan('Boxwood · 367A', '192.168.137.88', BOXWOOD)]
    })
    expect(d.cloud[0].health).toBe('online')
  })
})

describe('savedUpdates', () => {
  it('records the EndpointId a saved printer published', () => {
    const updates = savedUpdates(
      [saved('http://muon-boxwood-367a.local')],
      [lan('Boxwood', '192.168.137.88', BOXWOOD, { aliases: ['muon-boxwood-367a.local', '192.168.137.88'] })]
    )
    expect(updates).toEqual([{ apiUrl: 'http://muon-boxwood-367a.local', changes: { endpointId: BOXWOOD } }])
  })

  it('follows a printer saved by IP address to its new one', () => {
    const updates = savedUpdates(
      [saved('http://192.168.1.37', { endpointId: WALNUT })],
      [lan('Walnut', '192.168.137.32', WALNUT)]
    )
    expect(updates).toEqual([{
      apiUrl: 'http://192.168.1.37',
      changes: { apiUrl: 'http://192.168.137.32', socketUrl: 'ws://192.168.137.32/websocket' }
    }])
  })

  it('leaves a printer saved by name at its name', () => {
    const updates = savedUpdates(
      [saved('http://muon-walnut-8987.local', { endpointId: WALNUT })],
      [lan('Walnut', '192.168.137.32', WALNUT)]
    )
    expect(updates).toEqual([])
  })

  it('leaves the entry Fluidd is connected through alone', () => {
    const updates = savedUpdates(
      [saved('http://192.168.1.37', { endpointId: WALNUT, active: true })],
      [lan('Walnut', '192.168.137.32', WALNUT)]
    )
    expect(updates).toEqual([])
  })

  it('remembers the .local name of a saved printer', () => {
    const updates = savedUpdates(
      [saved('http://192.168.137.32', { endpointId: WALNUT })],
      [lan('Walnut', '192.168.137.32', WALNUT, { mdnsHost: 'muon-walnut-8987.local' })]
    )
    expect(updates).toEqual([{ apiUrl: 'http://192.168.137.32', changes: { mdnsHost: 'muon-walnut-8987.local' } }])
  })

  it('moves a printer saved by IP to its .local name when this page may not reach IPs', () => {
    // A page opened by name over global IPv6: walnut answered only at its name.
    const found = [lan('Walnut', 'muon-walnut-8987.local', WALNUT, { mdnsHost: 'muon-walnut-8987.local' })]
    const before = [saved('http://192.168.137.32', { endpointId: WALNUT, mdnsHost: 'muon-walnut-8987.local' })]
    expect(savedUpdates(before, found, true)).toEqual([{
      apiUrl: 'http://192.168.137.32',
      changes: { apiUrl: 'http://muon-walnut-8987.local', socketUrl: 'ws://muon-walnut-8987.local/websocket' }
    }])
    // A page that may reach IPs keeps the IP: it is only unreachable from that one page.
    expect(savedUpdates(before, found, false)).toEqual([])
  })
})
