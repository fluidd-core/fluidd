import { describe, expect, it } from 'vitest'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'
import type { CloudPrinter } from '@/services/muon-cloud/api'
import type { ForeignPrinterRecord, ForeignStatus } from '@/services/foreign-printers/types'
import { groupSummary, jobName, printersPage, type PageSources, type PrinterTile } from '../model'

function entry (key: string, fields: Partial<DirectoryEntry>): DirectoryEntry {
  return {
    key,
    section: 'local',
    name: key,
    endpointId: null,
    health: 'online',
    detail: 'Ready',
    host: '10.0.0.5',
    active: null,
    linkedTo: 'none',
    saved: [],
    ...fields
  }
}

function cloudPrinter (id: string, name: string): CloudPrinter {
  return { id, name, model: 'M1', version: '1', linked_at: 0, last_seen: 0, online: true, online_since: null }
}

function cloudEntry (id: string, name: string, fields: Partial<DirectoryEntry> = {}): DirectoryEntry {
  return entry(`cloud:${id}`, { section: 'cloud', name, cloud: cloudPrinter(id, name), linkedTo: 'mine', ...fields })
}

function sources (fields: Partial<PageSources>): PageSources {
  return {
    directory: { cloud: [], local: [], found: [] },
    groups: [],
    status: {},
    activeJob: null,
    signedIn: false,
    ...fields
  }
}

const names = (tiles: PrinterTile[]) => tiles.map(t => t.name)

describe('the Printers page', () => {
  it('keeps a reconnecting printer in its group with cached print data', () => {
    const page = printersPage(sources({
      directory: { cloud: [cloudEntry('b', 'Boxwood', { health: 'reconnecting', detail: 'Reconnecting…' })], local: [], found: [] },
      status: { b: { reachable: false, error: 'reconnecting', filename: 'part.gcode', progress: 0.42, updatedAt: 1 } }
    }))
    expect(page.groups[0].tiles[0]).toMatchObject({ label: 'Reconnecting…', job: { file: 'part.gcode', progress: 42 } })
    expect(page.offline).toHaveLength(0)
  })
  it('welcomes when nothing is saved, linked or found, signed out', () => {
    expect(printersPage(sources({})).welcome).toBe(true)
    expect(printersPage(sources({ signedIn: true })).welcome).toBe(false)
  })

  it('does not welcome once a printer turns up on this network', () => {
    const page = printersPage(sources({ directory: { cloud: [], local: [], found: [entry('found:a', { section: 'found', name: 'Rowan · 9F1D' })] } }))
    expect(page.welcome).toBe(false)
    expect(page.found).toHaveLength(1)
  })

  it('keeps foreign printers in Other printers and counts bridge-only records as offline', () => {
    const record: ForeignPrinterRecord = {
      id: 'foreign:bambu',
      kind: 'bambu',
      name: 'Bambu A1',
      host: '192.168.1.6',
      via: 'm1',
      m1Name: 'Workshop M1',
      formFactor: 'enclosed',
      credentialsRef: null,
      addedAt: 1
    }
    const status: ForeignStatus = {
      state: 'offline',
      message: 'Needs an M1 bridge',
      file: null,
      progress: null,
      timeLeft: null,
      temps: [],
      cameraUrl: null
    }
    const page = printersPage(sources({
      directory: {
        cloud: [],
        local: [],
        found: [],
        foreign: [entry('foreign:bambu', {
          section: 'foreign',
          name: record.name,
          host: record.host,
          health: 'offline',
          detail: status.message!,
          foreign: { record, status }
        })]
      }
    }))
    expect(page.other.map(tile => [tile.name, tile.state])).toEqual([['Bambu A1', 'offline']])
    expect(page.counts).toMatchObject({ printers: 1, offline: 1 })
    expect(page.welcome).toBe(false)
  })

  it('keeps a foreign print on its Other printers card, not Printing now', () => {
    const record: ForeignPrinterRecord = {
      id: 'foreign:voron',
      kind: 'moonraker',
      name: 'Workshop Voron',
      model: 'Voron 2.4',
      host: '192.168.1.25',
      via: 'direct',
      formFactor: 'open-frame',
      credentialsRef: null,
      addedAt: 1
    }
    const status: ForeignStatus = {
      state: 'printing',
      message: 'Printing',
      file: 'bracket.gcode',
      progress: 0.62,
      timeLeft: 1800,
      temps: [],
      cameraUrl: null
    }
    const page = printersPage(sources({
      directory: {
        cloud: [],
        local: [],
        found: [],
        foreign: [entry('foreign:voron', {
          section: 'foreign',
          name: record.name,
          host: record.host,
          health: 'printing',
          detail: status.message!,
          foreign: { record, status }
        })]
      }
    }))

    expect(page.printingNow).toEqual([])
    expect(page.other[0]).toMatchObject({ state: 'printing', label: '62%', job: { progress: 62, file: 'bracket.gcode' } })
    expect(page.counts).toMatchObject({ printers: 1, printing: 1 })
  })

  it('puts the account printers in their groups, in the groups\' order, and the rest after', () => {
    const page = printersPage(sources({
      signedIn: true,
      directory: {
        cloud: [cloudEntry('b', 'muon-boxwood-367a'), cloudEntry('w', 'muon-walnut-8987'), cloudEntry('m', 'muon-maple-1c04')],
        local: [],
        found: []
      },
      groups: [{ id: 'g1', name: 'Workshop', printers: ['w', 'b'] }]
    }))
    expect(page.groups.map(g => g.name)).toEqual(['Workshop', 'Not in a group'])
    expect(names(page.groups[0].tiles)).toEqual(['Walnut', 'Boxwood'])
    expect(names(page.groups[1].tiles)).toEqual(['Maple'])
    expect(page.groups[0].editable).toBe(true)
  })

  it('keeps an empty group of yours, to drop printers into', () => {
    const page = printersPage(sources({ signedIn: true, groups: [{ id: 'g1', name: 'Classroom', printers: [] }] }))
    expect(page.groups.map(g => g.name)).toEqual(['Classroom'])
  })

  it('lists printers saved in this browser in a group of their own', () => {
    const page = printersPage(sources({ directory: { cloud: [], local: [entry('local:a', { name: 'muon-hazel-52be' })], found: [] } }))
    expect(page.groups.map(g => g.name)).toEqual(['Saved in this browser'])
  })

  it('moves an offline printer out of its group into Offline', () => {
    const page = printersPage(sources({
      signedIn: true,
      directory: { cloud: [cloudEntry('e', 'muon-elm-7a20', { health: 'offline', detail: 'Last seen 2 days ago' })], local: [], found: [] },
      groups: [{ id: 'g1', name: 'Office', printers: ['e'] }]
    }))
    expect(page.groups[0].tiles).toHaveLength(0)
    expect(names(page.offline)).toEqual(['Elm'])
    expect(page.counts.offline).toBe(1)
  })

  it('shows a printing printer in Printing now and keeps it in its group', () => {
    const page = printersPage(sources({
      signedIn: true,
      directory: { cloud: [cloudEntry('b', 'muon-boxwood-367a', { health: 'printing' })], local: [], found: [] },
      groups: [{ id: 'g1', name: 'Workshop', printers: ['b'] }],
      status: { b: { reachable: true, filename: 'prints/ngmi_stamp.gcode', progress: 0.42, printDuration: 600, updatedAt: 1 } }
    }))
    expect(names(page.printingNow)).toEqual(['Boxwood'])
    expect(page.printingNow[0].groupName).toBe('Workshop')
    expect(page.printingNow[0].label).toBe('42%')
    expect(page.printingNow[0].detail).toBe('ngmi_stamp')
    expect(page.printingNow[0].job?.secondsLeft).toBeCloseTo(600 / 0.42 - 600)
    expect(names(page.groups[0].tiles)).toEqual(['Boxwood'])
  })

  it('reads the print on the printer Fluidd is on from its own socket', () => {
    const page = printersPage(sources({
      directory: { cloud: [], local: [entry('local:a', { name: 'muon-boxwood-367a', health: 'printing', active: 'local' })], found: [] },
      activeJob: { file: 'bracket.gcode', progress: 99, secondsLeft: 60, layer: 27, layers: 63, nozzle: 215, bed: 60 }
    }))
    expect(page.printingNow[0].job?.layer).toBe(27)
    expect(page.printingNow[0].label).toBe('99%')
  })

  it('counts who needs you: paused and faulted printers', () => {
    const page = printersPage(sources({
      directory: {
        cloud: [],
        local: [
          entry('local:a', { health: 'paused' }),
          entry('local:b', { health: 'error' }),
          entry('local:c', { health: 'online' })
        ],
        found: []
      }
    }))
    expect(page.counts).toMatchObject({ printers: 3, needsYou: 2, ready: 1, printing: 0 })
  })

  it('does not count a printer it cannot reach as one that needs you', () => {
    const page = printersPage(sources({
      signedIn: true,
      directory: { cloud: [cloudEntry('w', 'muon-walnut-8987', { health: 'error', detail: 'Unreachable: timed out' })], local: [], found: [] },
      status: { w: { reachable: false, error: 'timed out', updatedAt: 1 } }
    }))
    expect(page.groups[0].tiles[0]).toMatchObject({ state: 'unreachable', label: 'Unreachable', tone: 'off' })
    expect(page.counts.needsYou).toBe(0)
  })

  it("shows a fault on the printer Fluidd is on locally, whatever the account's way in says", () => {
    const page = printersPage(sources({
      signedIn: true,
      directory: { cloud: [cloudEntry('w', 'muon-walnut-8987', { health: 'error', active: 'local', detail: 'Klipper: shutdown' })], local: [], found: [] },
      status: { w: { reachable: false, error: 'timed out', updatedAt: 1 } }
    }))
    expect(page.groups[0].tiles[0].state).toBe('error')
    expect(page.counts.needsYou).toBe(1)
  })

  it('keeps "Not in a group" as a place to drop, even when every printer is in a group', () => {
    const page = printersPage(sources({
      signedIn: true,
      directory: { cloud: [cloudEntry('b', 'muon-boxwood-367a')], local: [], found: [] },
      groups: [{ id: 'g1', name: 'Workshop', printers: ['b'] }]
    }))
    expect(page.groups.map(g => [g.name, g.tiles.length])).toEqual([['Workshop', 1], ['Not in a group', 0]])
  })

  it('still counts a printer that answered with a fault', () => {
    const page = printersPage(sources({
      signedIn: true,
      directory: { cloud: [cloudEntry('w', 'muon-walnut-8987', { health: 'error' })], local: [], found: [] },
      status: { w: { reachable: true, state: 'error', updatedAt: 1 } }
    }))
    expect(page.counts.needsYou).toBe(1)
  })

  it('calls a found printer that is not set up yet new', () => {
    const found = entry('found:r', {
      section: 'found',
      name: 'muon-rowan-9f1d',
      health: 'available',
      row: { key: 'r', name: 'Rowan', host: null, meta: '', status: '', linked: false, canLink: false, action: 'set-up' }
    })
    const page = printersPage(sources({ directory: { cloud: [], local: [], found: [found] } }))
    expect(page.found[0]).toMatchObject({ state: 'new', label: 'New', tone: 'info' })
  })
})

describe('a group\'s summary', () => {
  const tile = (state: PrinterTile['state']) => ({ state } as PrinterTile)

  it('puts anyone needing you first', () => {
    expect(groupSummary([tile('ready'), tile('paused')])).toEqual({ text: '1 needs you', tone: 'warn' })
  })

  it('says all ready when they are', () => {
    expect(groupSummary([tile('ready'), tile('ready')])).toEqual({ text: 'All ready', tone: 'ok' })
  })

  it('counts printing and ready', () => {
    expect(groupSummary([tile('printing'), tile('ready'), tile('ready')])).toEqual({ text: '1 printing · 2 ready', tone: 'run' })
  })
})

describe('a job\'s name', () => {
  it('drops the folders and the G-code extension', () => {
    expect(jobName('prints/ngmi_stamp.gcode')).toBe('ngmi_stamp')
    expect(jobName('bracket.bgcode')).toBe('bracket')
    expect(jobName(null)).toBeNull()
  })
})
