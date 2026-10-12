import { describe, expect, it } from 'vitest'
import { hostSetup } from '../setup'
import { materialChoices } from '@/services/control/model'
import { parseHostSetup } from '../vendor/printer-client/bridge/protocol'

const choices = materialChoices([
  { id: 1, name: 'PLA', nozzle: 210, bed: 55 },
  { id: 2, name: 'PETG', nozzle: 245, bed: 80 }
])

describe('what the printer has loaded, for the slicer', () => {
  it('takes Spoolman\'s spool first, its temperatures or else the table\'s', () => {
    const setup = hostSetup({
      spool: { remaining_weight: 640, filament: { name: 'Teal', material: 'PETG', color_hex: '1aa0a0', settings_extruder_temp: null, settings_bed_temp: 85 } },
      loaded: choices[0],
      heated: null,
      choices
    })
    expect(setup.material).toEqual({ name: 'PETG Teal', type: 'PETG', colour: '#1AA0A0', nozzle: 245, bed: 85, source: 'spool', remaining: 640 })
  })

  it('then what the printer was told is loaded, with the table\'s temperatures and no colour', () => {
    expect(hostSetup({ spool: null, loaded: choices[1], heated: choices[0], choices }).material)
      .toEqual({ name: 'PETG', type: 'PETG', colour: null, nozzle: 245, bed: 80, source: 'loaded' })
  })

  it("with the colour someone set for what's loaded (muon_material_color, KAN-516)", () => {
    expect(hostSetup({ spool: null, loaded: choices[1], loadedColour: '#2f63c6', heated: null, choices }).material)
      .toEqual({ name: 'PETG', type: 'PETG', colour: '#2F63C6', nozzle: 245, bed: 80, source: 'loaded' })
  })

  it('then the material the heaters are set to, else nothing', () => {
    expect(hostSetup({ spool: null, loaded: null, heated: choices[0], choices }).material?.source).toBe('heaters')
    expect(hostSetup({ spool: null, loaded: null, heated: null, choices }).material).toBeNull()
  })

  it('sends the table with each type\'s swatch, and passes the slicer\'s own check', () => {
    const setup = hostSetup({ spool: null, loaded: choices[0], heated: null, choices })
    expect(setup.materials.map(m => m.name)).toEqual(['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'PA', 'PC'])
    expect(setup.materials[0]).toMatchObject({ type: 'PLA', colour: '#E8A53B', nozzle: 210, bed: 55, source: 'table' })
    expect(parseHostSetup(setup)).toEqual(setup)
  })
})
