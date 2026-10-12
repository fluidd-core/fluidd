import { describe, expect, it } from 'vitest'
import { arrangeMacros, macroDescription, macroParams, macroTitle, macroUse, promptTargets, topMacros, type MacroSource } from '../arrange'

// An M1's macros, cut down: names, descriptions and enough G-code to show how they call each other.
const M1: MacroSource[] = [
  { name: 'load_filament', description: 'Backward-compatible alias for FILAMENT_INSERT_FLOW', gcode: 'FILAMENT_INSERT_FLOW' },
  { name: 'load_filament_prompt', description: 'Backward-compatible alias for FILAMENT_INSERT_FLOW', gcode: 'FILAMENT_INSERT_FLOW' },
  { name: 'filament_insert_flow', description: 'Attempt a sensorless filament load and branch on the result', gcode: 'FILAMENT_INSERT_SENSORLESS_LOAD' },
  { name: 'filament_insert_sensorless_load', description: 'Run a bounded sensorless grab move', gcode: '{% set s = params.SPEED|default(10) %}' },
  { name: 'filament_insert_load_failed_prompt', description: '', gcode: 'RESPOND TYPE=command MSG="action:prompt_footer_button Try Load Again|FILAMENT_INSERT_SENSORLESS_LOAD|primary"' },
  { name: 'unload_filament', description: 'Unloads filament from toolhead. EXTRUDER_TEMP defaults to 210', gcode: '{% set t = params.TEMP|default(210) %}' },
  { name: 'cut_filament', description: 'Move to cutter and perform filament cut sweep', gcode: '' },
  { name: 'print_end', description: 'print finish sequence', gcode: 'CUT_FILAMENT\nPARK_PRINTER' },
  { name: 'print_start', description: 'print startup sequence', gcode: '{% set bed = params.BED %}' },
  { name: 'park_printer', description: 'Moves the toolhead to end of print position', gcode: '' },
  { name: 'center', description: 'Moves the toolhead to the center', gcode: '' },
  { name: 'front', description: 'Moves the toolhead to the front', gcode: '' },
  { name: 'calibrate_heating_hotend', description: '"Calibrate the tuning of the hotend for more accurate temperature control"', gcode: '' },
  { name: 'calibrate_heating_bed', description: '"Calibrate the tuning of the bed"', gcode: '' },
  { name: 'led_ready', description: 'G-Code macro', gcode: '' },
  { name: 'hotend_fan_check', description: 'G-Code macro', gcode: '' },
  { name: 'toolhead_connect', description: 'Called when toolhead is reconnected with the umbilical', gcode: '' },
  { name: 'insert_filament_sensor', description: 'Trigger insert flow when printer is idle or paused', gcode: '' },
  { name: 'speed_slow_pre_purge_for_tpu', description: 'If MATERIAL is TPU, slow overall speed', gcode: '' },
  { name: 'pause', description: 'Pause the actual running print', gcode: 'PAUSE_BASE', renameExisting: 'PAUSE_BASE' },
  { name: 'm600', description: 'Prompt user to pause print and unload filament', gcode: '' }
]
const M1_HOOKS = ['\nUPDATE_DELAYED_GCODE ID=CHECK_ALL_FANS DURATION=3\nHOTEND_FAN_CHECK']

// A Voron-style printer: nothing like an M1's names.
const VORON: MacroSource[] = [
  { name: 'PRINT_START', gcode: '{% set bed = params.BED|int %}' },
  { name: 'PRINT_END', gcode: '' },
  { name: 'CLEAN_NOZZLE', gcode: '' },
  { name: 'PURGE_LINE', gcode: '' },
  { name: 'LIGHTS_ON', gcode: '' },
  { name: 'LIGHTS_OFF', gcode: '' },
  { name: 'PID_EXTRUDER', gcode: '{% set t = params.TEMP|default(240) %}' },
  { name: 'NOZZLE_CHANGE_POSITION', gcode: '' },
  { name: 'PARK', gcode: '' },
  { name: 'BED_FANS', gcode: '{% set s = params.SPEED %}' }
]

describe('names and descriptions', () => {
  it('turns a macro\'s name into words, leaving G-code numbers as they are', () => {
    expect(macroTitle('LOAD_FILAMENT')).toBe('Load filament')
    expect(macroTitle('z_park')).toBe('Z park')
    expect(macroTitle('CALIBRATE_HEATING_HOTEND')).toBe('Calibrate heating hotend')
    expect(macroTitle('led_ready')).toBe('LED ready')
    expect(macroTitle('M600')).toBe('M600')
  })

  it('drops Klipper\'s placeholder description and stray quotes', () => {
    expect(macroDescription('G-Code macro')).toBe('')
    expect(macroDescription('"Calibrate the probe"')).toBe('Calibrate the probe')
    expect(macroDescription(undefined)).toBe('')
  })

  it('knows which parameters a press can leave out', () => {
    expect(macroParams('{% set t = params.TEMP|default(210) %}')).toEqual({ params: ['TEMP'], needsParams: false })
    expect(macroParams('{% set bed = params.BED %}')).toEqual({ params: ['BED'], needsParams: true })
    expect(macroParams('{% if params.SPEED is defined %}{% set s = params.SPEED %}{% endif %}').needsParams).toBe(false)
  })

  it('finds the macros a prompt\'s buttons run', () => {
    expect(promptTargets(['RESPOND TYPE=command MSG="action:prompt_footer_button Resume Print|_BED_RESUME_NOW|primary"'])).toEqual(['_BED_RESUME_NOW'])
  })
})

describe('arranging an M1\'s macros', () => {
  const arranged = arrangeMacros(M1, M1_HOOKS)
  const of = (name: string) => arranged.find(m => m.name === name)!

  it('groups them by what they are for', () => {
    expect(of('UNLOAD_FILAMENT').group).toBe('filament')
    expect(of('CENTER').group).toBe('moving')
    expect(of('CALIBRATE_HEATING_BED').group).toBe('calibration')
    expect(of('LED_READY').group).toBe('lights')
    expect(of('PRINT_START').group).toBe('printing')
  })

  it('keeps the friendliest of a macro and its aliases', () => {
    expect(of('LOAD_FILAMENT').group).toBe('filament')
    expect(of('FILAMENT_INSERT_FLOW').internal).toBe('The same as LOAD_FILAMENT')
    expect(of('LOAD_FILAMENT_PROMPT').internal).toBe('The same as LOAD_FILAMENT')
  })

  it('sets aside what the printer runs by itself', () => {
    expect(of('FILAMENT_INSERT_SENSORLESS_LOAD').internal).toMatch(/prompts/)
    expect(of('FILAMENT_INSERT_LOAD_FAILED_PROMPT').internal).toMatch(/step/)
    expect(of('HOTEND_FAN_CHECK').internal).toMatch(/happens/)
    expect(of('TOOLHEAD_CONNECT').internal).toMatch(/Called when/)
    expect(of('INSERT_FILAMENT_SENSOR').internal).toMatch(/when printer is idle/)
    expect(of('SPEED_SLOW_PRE_PURGE_FOR_TPU').internal).toBe('A step of printing')
    expect(of('PAUSE').internal).toMatch(/Replaces PAUSE/)
    for (const m of arranged.filter(a => a.internal)) expect(m.group).toBe('printer')
  })

  it('puts the everyday ones first, a couple from each group', () => {
    expect(topMacros(arranged, 6).map(m => m.name)).toEqual([
      'LOAD_FILAMENT', 'UNLOAD_FILAMENT', 'CENTER', 'FRONT', 'CALIBRATE_HEATING_BED', 'CALIBRATE_HEATING_HOTEND'
    ])
  })

  it('moves what you run often up', () => {
    const used = macroUse(['CUT_FILAMENT', 'cut_filament', 'CUT_FILAMENT SPEED=5', 'G28', 'CENTER'], M1.map(m => m.name))
    expect(used).toEqual({ CUT_FILAMENT: 3, CENTER: 1 })
    expect(topMacros(arrangeMacros(M1, M1_HOOKS, used), 2).map(m => m.name)).toEqual(['CUT_FILAMENT', 'LOAD_FILAMENT'])
  })
})

describe('arranging another printer\'s', () => {
  const arranged = arrangeMacros(VORON, [])
  const of = (name: string) => arranged.find(m => m.name === name)!

  it('groups names it has never seen', () => {
    expect(of('CLEAN_NOZZLE').group).toBe('nozzle')
    expect(of('PURGE_LINE').group).toBe('filament')
    expect(of('LIGHTS_ON').group).toBe('lights')
    expect(of('PID_EXTRUDER').group).toBe('calibration')
    expect(of('PARK').group).toBe('moving')
    expect(of('BED_FANS').group).toBe('fans')
    expect(of('BED_FANS').needsParams).toBe(true)
  })

  it('surfaces the ones a person presses, not the slicer\'s', () => {
    const top = topMacros(arranged, 4).map(m => m.name)
    expect(top).toContain('CLEAN_NOZZLE')
    expect(top).toContain('PARK')
    expect(top).not.toContain('PRINT_START')
  })
})
