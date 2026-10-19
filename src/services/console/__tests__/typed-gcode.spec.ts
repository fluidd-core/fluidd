import { describe, expect, it } from 'vitest'
import { inspectTypedGcode } from '../typed-gcode'

const config = {
  settings: { 'filament_switch_sensor loader': {}, 'filament_motion_sensor runout': {} },
  config: { 'filament_switch_sensor loader': { insert_gcode: 'INSERT_FILAMENT_SENSOR' } }
}

describe('Klipper typed sensor preflight', () => {
  it.each([
    '  set_filament_sensor\tSeNsOr=loader\tEnAbLe="-0" # comment',
    "SET_FILAMENT_SENSOR SENSOR='loader' ENABLE='+00'",
    'SET_FILAMENT_SENSOR SENSOR=loader ENABLE=1 ENABLE=0',
    'SET_FILAMENT_SENSOR SENSOR=loader ENABLE=0 ; ENABLE=1',
    'SET_FILAMENT_SENSOR SENSOR=loader ENABLE=0 # ENABLE=1',
    'N3SET_FILAMENT_SENSOR SENSOR=loader ENABLE=0*99',
    'M105\r\nSET_FILAMENT_SENSOR SENSOR=loader ENABLE=0\r\nM105',
    'SET_FILAMENT_SENSOR SENSOR=loader ENABLE="0',
    'SET_FILAMENT_SENSOR SENSOR=loader ENABLE=0_0',
    'SET_FILAMENT_SENSOR SENSOR=loader ENABLE=0.0',
    'SET_FILAMENT_SENSOR SENSOR=load\\er ENABLE=0',
    'SET_FILAMENT_SENSOR SENSOR=loader ENABLE = 0'
  ])('refuses disabling or ambiguous sensor syntax: %s', script => {
    expect(inspectTypedGcode(script, config).refusal).toMatch(/^Not sent\./)
  })

  it.each([
    '; SET_FILAMENT_SENSOR SENSOR=loader ENABLE=0\nM105',
    'QUERY_FILAMENT_SENSOR SENSOR=loader',
    'SET_FILAMENT_SENSOR SENSOR=loader ENABLE=0 ENABLE=1',
    'SET_FILAMENT_SENSOR SENSOR=runout ENABLE=0 ; SENSOR=loader',
    'SET_FILAMENT_SENSOR SENSOR="runout" ENABLE="0"',
    'SET_FILAMENT_SENSOR SENSOR=runout ENABLE=0 # SENSOR=loader',
    'RESPOND MSG="SET_FILAMENT_SENSOR SENSOR=loader ENABLE=0"'
  ])('allows a query, enable, known runout-only off or inert text: %s', script => {
    expect(inspectTypedGcode(script, config).refusal).toBeNull()
  })

  it.each(['RESTART', 'firmware_restart'])('recognises recovery restarts: %s', script => {
    expect(inspectTypedGcode(script, config)).toEqual({ refusal: null, restarts: true, onlyRestarts: true, savesConfig: false })
  })

  it('distinguishes SAVE_CONFIG from recovery-only batches', () => {
    expect(inspectTypedGcode('N2 SAVE_CONFIG*34', config)).toEqual({ refusal: null, restarts: true, onlyRestarts: false, savesConfig: true })
    expect(inspectTypedGcode('RESTART\nSAVE_CONFIG', config)).toEqual({ refusal: null, restarts: true, onlyRestarts: false, savesConfig: true })
  })
})
