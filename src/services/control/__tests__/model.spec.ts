import { describe, expect, it, test } from 'vitest'
import type { TemperaturePreset } from '@/store/config/types'
import {
  clampTo,
  extrudeBlocked,
  fanCommand,
  fanPercent,
  lightsOutput,
  materialInUse,
  materialsFrom,
  pinCommand,
  pinPercent,
  extrudeLengths,
  plateToPosition,
  speedName,
  stepTarget
} from '../model'

const preset = (id: number, name: string, nozzle: number, bed: number | null): TemperaturePreset => ({
  id,
  name,
  values: {
    extruder: { value: nozzle, type: 'heater', active: true },
    ...(bed === null ? {} : { heater_bed: { value: bed, type: 'heater', active: true } })
  }
})

describe('speed (U4)', () => {
  test.each([[75, 'Slow'], [100, 'Normal'], [125, 'Fast'], [110, 'Custom 110%'], [99.6, 'Normal']])('%s%% is %s', (percent, name) => {
    expect(speedName(percent)).toBe(name)
  })
})

describe('materials (U5)', () => {
  const materials = materialsFrom([
    preset(1, 'PLA', 215, 60),
    preset(2, 'PETG', 240, 80),
    { id: 3, name: 'Fans only', values: { chamber_fan: { value: 30, type: 'fan', active: true } } }
  ])

  it('are the presets that heat the nozzle', () => {
    expect(materials.map(m => m.name)).toEqual(['PLA', 'PETG'])
  })

  it('know which one the heaters are set to', () => {
    expect(materialInUse(materials, 240, 80)?.name).toBe('PETG')
    expect(materialInUse(materials, 240, 60)).toBeNull()
    expect(materialInUse(materials, 0, 0)).toBeNull()
  })
})

describe('a heater\'s − and +', () => {
  it('go from Off straight to a useful heat, then 5° a step', () => {
    expect(stepTarget(0, 1, 170, 300)).toBe(170)
    expect(stepTarget(170, 1, 170, 300)).toBe(175)
  })

  it('go back to Off below that heat', () => {
    expect(stepTarget(170, -1, 170, 300)).toBe(0)
    expect(stepTarget(215, -1, 170, 300)).toBe(210)
  })

  it('stop at the heater\'s maximum', () => {
    expect(stepTarget(298, 1, 170, 300)).toBe(300)
  })
})

describe('moving', () => {
  it('stays inside the machine', () => {
    expect(clampTo(-5, 0, 200)).toBe(0)
    expect(clampTo(250, 0, 200)).toBe(200)
  })

  it('puts the head where the plate was clicked, Y up', () => {
    expect(plateToPosition(0.5, 0.5, [0, 0], [200, 180])).toEqual([100, 90])
    expect(plateToPosition(0, 0, [0, 0], [200, 180])).toEqual([0, 180])
    expect(plateToPosition(1.2, 1, [0, 0], [200, 180])).toEqual([200, 0])
  })
})

describe('outputs', () => {
  test.each([['caselight', true], ['lights', true], ['case_light', true], ['led', true], ['chamber_lights', true], ['highlight_pin', false], ['heater', false]])('%s is the lights: %s', (name, yes) => {
    expect(!!lightsOutput([{ name }])).toBe(yes)
  })

  it('reads a fan as a percentage of its maximum', () => {
    expect(fanPercent({ speed: 0.4, config: { max_power: 0.8 } } as never)).toBe(50)
    expect(fanPercent({ speed: 0, config: {} } as never)).toBe(0)
  })

  it('sets the part fan with M106 and a generic fan by name', () => {
    expect(fanCommand({ type: 'fan', name: 'fan' }, 100)).toBe('M106 S255')
    expect(fanCommand({ type: 'fan_generic', name: 'aux' }, 50)).toBe('SET_FAN_SPEED FAN=aux SPEED=0.5')
    expect(fanCommand({ type: 'heater_fan', name: 'hotend' }, 50)).toBeNull()
  })

  it("reads a pin's level as Klipper reports it, already divided by its scale", () => {
    // A light on a 0-255 pin, set to half: SET_PIN VALUE=127.5 reports 0.5.
    expect(pinPercent(0.5)).toBe(50)
    expect(pinCommand({ name: 'caselight', scale: 255, pwm: true }, 50)).toBe('SET_PIN PIN=caselight VALUE=127.5')
  })

  it('offers only the lengths the extruder takes', () => {
    expect(extrudeLengths(50)).toEqual([5, 10, 25, 50])
    expect(extrudeLengths(30)).toEqual([5, 10, 25])
    expect(extrudeLengths(3)).toEqual([3])
  })

  it('sets a pin by its scale', () => {
    expect(pinCommand({ name: 'caselight', scale: 1, pwm: true }, 80)).toBe('SET_PIN PIN=caselight VALUE=0.8')
    expect(pinCommand({ name: 'caselight', scale: 1, pwm: false }, true)).toBe('SET_PIN PIN=caselight VALUE=1')
  })
})

describe('the extruder', () => {
  it('says why it can\'t move filament', () => {
    expect(extrudeBlocked(26, 170)).toBe("Heat the nozzle first · it's at 26°, it needs 170°")
    expect(extrudeBlocked(200, 170)).toBeNull()
    expect(extrudeBlocked(26, 170, true)).toBeNull()
  })
})
