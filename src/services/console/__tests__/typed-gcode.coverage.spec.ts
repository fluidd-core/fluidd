import { describe, expect, it } from 'vitest'
import { inspectTypedGcode } from '../typed-gcode'

const runout = {
  settings: { 'filament_switch_sensor runout': {} },
  config: { 'filament_switch_sensor runout': {} }
}

describe('typed G-code hardening branches', () => {
  it('refuses a sensor command when configuration has not arrived', () => {
    expect(inspectTypedGcode('SET_FILAMENT_SENSOR SENSOR=runout ENABLE=0').refusal)
      .toContain('settings have not loaded')
  })

  it('refuses missing, non-integral, and flag-style ENABLE values', () => {
    for (const command of [
      'SET_FILAMENT_SENSOR SENSOR=runout',
      'SET_FILAMENT_SENSOR SENSOR=runout ENABLE=',
      'SET_FILAMENT_SENSOR SENSOR=runout ENABLE=1e0',
      'SET_FILAMENT_SENSOR SENSOR=runout ENABLE'
    ]) expect(inspectTypedGcode(command, runout).refusal).toContain('Check the sensor name')
  })

  it('refuses an unterminated single quote and any escape sequence', () => {
    expect(inspectTypedGcode("SET_FILAMENT_SENSOR SENSOR='runout ENABLE=0", runout).refusal).not.toBeNull()
    expect(inspectTypedGcode('SET_FILAMENT_SENSOR SENSOR=runout ENABLE=\\0', runout).refusal).not.toBeNull()
  })

  it('preflights every line and reports restart state before a later refusal', () => {
    expect(inspectTypedGcode('RESTART\nSET_FILAMENT_SENSOR SENSOR=runout ENABLE=no', runout)).toEqual({
      refusal: 'Not sent. Check the sensor name and ENABLE value. Control cannot safely check this sensor command.',
      restarts: true,
      onlyRestarts: false
    })
  })

  it('does not treat restart-like prefixes or comments as restart commands', () => {
    expect(inspectTypedGcode('; RESTART\nRESTART_NOW\nM105')).toEqual({ refusal: null, restarts: false, onlyRestarts: false })
  })

  it('accepts numbered sensor commands without a checksum and with CRLF input', () => {
    expect(inspectTypedGcode('N12 SET_FILAMENT_SENSOR SENSOR=runout ENABLE=-0\r\nM105', runout).refusal).toBeNull()
  })
})
