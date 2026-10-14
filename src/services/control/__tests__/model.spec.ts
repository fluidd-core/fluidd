import { describe, expect, it, test } from 'vitest'
import type { TemperaturePreset } from '@/store/config/types'
import { defaultState } from '@/store/printer/state'
import {
  clampTo,
  configShaper,
  filamentSensorRole,
  ledCommand,
  ledPercent,
  parseShaperReport,
  retractionCommand,
  sensorCommand,
  shaperCommand,
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
  stepTarget,
  colourName,
  normaliseColour,
  saveMaterialColourCommand,
  savedMaterialColour
} from '../model'

describe("the loaded filament's colour", () => {
  it('is kept on the printer beside the material, without the # a G-code reader could take for a comment', () => {
    expect(saveMaterialColourCommand('#f07b22')).toBe('SAVE_VARIABLE VARIABLE=muon_material_color VALUE=\'"F07B22"\'')
    expect(() => saveMaterialColourCommand('orange')).toThrow()
  })

  it('is read back however it was written, and is nothing when nobody has said', () => {
    expect(savedMaterialColour({ muon_material_color: 'F07B22' })).toBe('#F07B22')
    expect(savedMaterialColour({ muon_material_color: '"#f07b22"' })).toBe('#F07B22')
    expect(savedMaterialColour({ muon_material: 'PLA' })).toBeNull()
    expect(savedMaterialColour({ muon_material_color: 'red' })).toBeNull()
    expect(normaliseColour(12)).toBeNull()
  })

  it('is named as a spool would be, or a custom colour', () => {
    expect(colourName('#f07b22')).toBe('Orange')
    expect(colourName('#123456')).toBe('Custom colour')
    expect(colourName(null)).toBe('')
  })
})

const preset = (id: number, name: string, nozzle: number, bed: number | null): TemperaturePreset => ({
  id,
  name,
  values: {
    extruder: { value: nozzle, type: 'heater', active: true },
    ...(bed === null ? {} : { heater_bed: { value: bed, type: 'heater', active: true } })
  }
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

  it('puts the head where the plate was clicked: the M1\'s Y grows toward the front, the bottom of the pad', () => {
    expect(plateToPosition(0.5, 0.5, [0, 0], [200, 180])).toEqual([100, 90])
    expect(plateToPosition(0, 0, [0, 0], [200, 180])).toEqual([0, 0])
    expect(plateToPosition(1.2, 1, [0, 0], [200, 180])).toEqual([200, 180])
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

describe('Pro\'s tuning', () => {
  it('reads both shapers from what Klipper answers', () => {
    const text = 'shaper_type_x:mzv shaper_freq_x:52.400 damping_ratio_x:0.100000\nshaper_type_y:2hump_ei shaper_freq_y:38.200 damping_ratio_y:0.100000'
    expect(parseShaperReport(text)).toEqual({ x: { type: 'mzv', freq: 52.4 }, y: { type: '2hump_ei', freq: 38.2 } })
  })

  it('reads one axis, or nothing, from other lines', () => {
    expect(parseShaperReport('shaper_type_y:ei shaper_freq_y:41.000 damping_ratio_y:0.1')).toEqual({ y: { type: 'ei', freq: 41 } })
    expect(parseShaperReport('// Klipper state: Ready')).toEqual({})
  })

  it('takes an axis\'s own shaper type from printer.cfg over the shared one', () => {
    expect(configShaper({ shaper_type: 'ei', shaper_type_x: 'zv', shaper_freq_x: 60, shaper_freq_y: 40 }, 'x')).toEqual({ type: 'zv', freq: 60 })
    expect(configShaper({ shaper_type: 'ei', shaper_freq_y: 40 }, 'y')).toEqual({ type: 'ei', freq: 40 })
    expect(configShaper({}, 'y')).toEqual({ type: 'mzv', freq: 0 })
    expect(configShaper(undefined, 'x')).toBeNull()
  })

  it('sets a shaper with SET_INPUT_SHAPER, to two places', () => {
    expect(shaperCommand('y', { type: 'mzv', freq: 38.2049 })).toBe('SET_INPUT_SHAPER SHAPER_TYPE_Y=mzv SHAPER_FREQ_Y=38.2')
  })

  it('sets retraction', () => {
    expect(retractionCommand('unretract_extra_length', 0.05)).toBe('SET_RETRACTION UNRETRACT_EXTRA_LENGTH=0.05')
  })

  it('reads and sets an LED\'s brightness', () => {
    expect(ledPercent([[0.2, 0.8, 0.4, 0]])).toBe(80)
    expect(ledPercent(undefined)).toBe(0)
    expect(ledCommand('status', 40)).toBe('SET_LED LED=status RED=0.4 GREEN=0.4 BLUE=0.4 WHITE=0.4')
  })
})

/**
 * Klipper's configfile object for the M1's toolhead sensor, as core.cfg
 * sets it: insert_gcode starts the automatic load, and it stays armed
 * (Jack, 10 Oct 2026). `settings` is what Klipper loaded, `config` the
 * file's raw text.
 */
const m1 = {
  settings: {
    'filament_switch_sensor filament_sensor_toolhead': {
      pause_on_runout: false,
      insert_gcode: 'INSERT_FILAMENT_SENSOR',
      pause_delay: 0.5,
      event_delay: 3,
      debounce_delay: 0.2,
      switch_pin: '!toolhead:gpio3'
    }
  },
  config: {
    'filament_switch_sensor filament_sensor_toolhead': {
      pause_on_runout: 'False',
      insert_gcode: 'INSERT_FILAMENT_SENSOR',
      debounce_delay: '0.2',
      switch_pin: '!toolhead:gpio3'
    }
  }
}

/** A stock runout sensor: it pauses the print, and nothing loads filament. */
const runoutOnly = {
  settings: {
    'filament_switch_sensor runout': { pause_on_runout: true, runout_gcode: '', pause_delay: 0.5, event_delay: 3, switch_pin: '^PG12' }
  },
  config: {
    'filament_switch_sensor runout': { switch_pin: '^PG12' }
  }
}

describe('filament sensors and the automatic load', () => {
  it('knows a sensor whose insert_gcode is set loads filament', () => {
    expect(filamentSensorRole(m1, 'filament_sensor_toolhead')).toBe('loads')
    expect(filamentSensorRole(runoutOnly, 'runout')).toBe('runout')
  })

  it('never turns off a sensor that loads filament', () => {
    expect(sensorCommand('filament_sensor_toolhead', false, m1)).toBeNull()
  })

  it('turns a sensor that loads filament back on, and only on', () => {
    expect(sensorCommand('filament_sensor_toolhead', true, m1)).toBe('SET_FILAMENT_SENSOR SENSOR=filament_sensor_toolhead ENABLE=1')
    expect(sensorCommand('filament_sensor_toolhead', false, m1)).toBeNull()
  })

  it('turns a runout-only sensor off and on, beside one that loads filament', () => {
    const both = {
      settings: { ...m1.settings, ...runoutOnly.settings },
      config: { ...m1.config, ...runoutOnly.config }
    }
    expect(sensorCommand('runout', false, both)).toBe('SET_FILAMENT_SENSOR SENSOR=runout ENABLE=0')
    expect(sensorCommand('runout', true, both)).toBe('SET_FILAMENT_SENSOR SENSOR=runout ENABLE=1')
    expect(sensorCommand('filament_sensor_toolhead', false, both)).toBeNull()
  })

  it('reads a motion sensor the same way', () => {
    const motion = { settings: { 'filament_motion_sensor smart': { insert_gcode: 'LOAD_IT', detection_length: 7 } } }
    expect(filamentSensorRole(motion, 'smart')).toBe('loads')
    expect(sensorCommand('smart', false, motion)).toBeNull()
  })

  it('takes insert_gcode from the raw config when the settings lack it', () => {
    const rawOnly = {
      settings: { 'filament_switch_sensor filament_sensor_toolhead': { pause_on_runout: false } },
      config: m1.config
    }
    expect(sensorCommand('filament_sensor_toolhead', false, rawOnly)).toBeNull()
  })

  it('matches the section whatever its case', () => {
    const shouted = { settings: { 'filament_switch_sensor Filament_Sensor_Toolhead': { insert_gcode: 'INSERT_FILAMENT_SENSOR' } } }
    expect(sensorCommand('filament_sensor_toolhead', false, shouted)).toBeNull()
  })

  it('treats an empty insert_gcode as no load', () => {
    const empty = { settings: { 'filament_switch_sensor runout': { pause_on_runout: true, insert_gcode: '  \n' } } }
    expect(filamentSensorRole(empty, 'runout')).toBe('runout')
    expect(sensorCommand('runout', false, empty)).toBe('SET_FILAMENT_SENSOR SENSOR=runout ENABLE=0')
  })

  it('keeps every sensor on while the printer\'s settings are absent or still loading', () => {
    // What the store holds before Klipper's configfile arrives: no sensor sections.
    const loading = defaultState().printer.configfile
    for (const configfile of [undefined, {}, { settings: {} }, loading, { config: runoutOnly.config }]) {
      expect(filamentSensorRole(configfile, 'runout')).toBe('unknown')
      expect(sensorCommand('runout', false, configfile)).toBeNull()
      expect(sensorCommand('runout', true, configfile)).toBe('SET_FILAMENT_SENSOR SENSOR=runout ENABLE=1')
    }
  })

  it('keeps on a sensor the settings do not name', () => {
    expect(sensorCommand('other', false, runoutOnly)).toBeNull()
  })
})
