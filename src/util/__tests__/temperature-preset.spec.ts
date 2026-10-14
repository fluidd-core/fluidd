import { describe, expect, it } from 'vitest'
import type { TemperaturePreset } from '@/store/config/types'
import { presetCommands, presetSummary } from '../temperature-preset'

const pla: TemperaturePreset = {
  id: 1,
  name: 'PLA',
  values: {
    heater_bed: { value: 60, type: 'heater', active: true },
    extruder: { value: 215, type: 'heater', active: true },
    chamber_fan: { value: 35, type: 'fan', active: true },
    extruder1: { value: 200, type: 'heater', active: false }
  },
  gcode: 'M117 PLA'
}

describe('a temperature preset', () => {
  it('sends each active target, then its own G-code', () => {
    expect(presetCommands(pla)).toEqual([
      'SET_HEATER_TEMPERATURE HEATER=heater_bed TARGET=60',
      'SET_HEATER_TEMPERATURE HEATER=extruder TARGET=215',
      'SET_TEMPERATURE_FAN_TARGET TEMPERATURE_FAN=chamber_fan TARGET=35',
      'M117 PLA'
    ])
  })

  it('reads as nozzle then bed', () => {
    expect(presetSummary(pla)).toBe('215° / 60°')
  })
})
