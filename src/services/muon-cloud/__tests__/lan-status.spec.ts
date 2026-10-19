import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadedRecord, statusFrom } from '../status'

// discovery.ts reads the store and the Muon3D API client at import. Neither is
// used by the code under test, and loading the real store is slow.
vi.mock('@/store', () => ({ default: {} }))
vi.mock('../api', () => ({ cloudApi: {} }))

const { printerHealth } = await import('../discovery')

/** Walnut mid-print, as Moonraker answers `printer.objects.query`. */
const WALNUT = {
  webhooks: { state: 'ready', state_message: 'Printer is ready' },
  print_stats: { state: 'printing', filename: 'Harry/tray_v2_PETG.gcode', print_duration: 2900, total_duration: 3000, filament_used: 1800, info: { current_layer: 22, total_layer: 40 } },
  virtual_sdcard: { progress: 0.56, file_position: 15000, file_size: 26875 },
  display_status: { progress: 0.56, message: null },
  extruder: { temperature: 239.6, target: 240 },
  heater_bed: { temperature: 79.8, target: 80 },
  save_variables: { variables: { muon_material: 'PETG', muon_material_colour: '2f63c6' } }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('a printer found on this network', () => {
  it('says in one read what its card shows: the job, progress, layer, temperatures and what is loaded', async () => {
    // 14 Oct: Walnut, printing on Jack's network, showed only "Printing"
    // until he opened it and came back.
    const fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ result: { status: WALNUT } }) }) as unknown as Response)
    vi.stubGlobal('fetch', fetch)

    const health = await printerHealth('http://192.168.137.73')

    expect(health).toMatchObject({
      state: 'printing',
      status: {
        reachable: true,
        filename: 'Harry/tray_v2_PETG.gcode',
        progress: 0.56,
        layer: 22,
        totalLayers: 40,
        extruder: { temperature: 239.6, target: 240 },
        bed: { temperature: 79.8, target: 80 },
        material: { name: 'PETG', colour: '#2F63C6' }
      }
    })
    const url = String((fetch.mock.calls[0] as unknown[])[0])
    expect(url).toContain('/printer/objects/query?')
    expect(url).toContain('save_variables')
  })
})

describe('what the printer says is loaded', () => {
  it('reads the material and the colour, in either spelling', () => {
    expect(loadedRecord({ muon_material: '"PLA"', muon_material_color: '#e8a53b' })).toEqual({ name: 'PLA', colour: '#E8A53B' })
    expect(loadedRecord({ muon_material: 'PETG' })).toEqual({ name: 'PETG', colour: null })
    expect(loadedRecord({ mesh_valid: 0 })).toBeUndefined()
    expect(loadedRecord(undefined)).toBeUndefined()
  })

  it('is part of a status read through Muon3D as well', () => {
    expect(statusFrom(WALNUT).material).toEqual({ name: 'PETG', colour: '#2F63C6' })
    expect(statusFrom({ webhooks: { state: 'shutdown' } }).state).toBe('klipper shutdown')
  })
})
