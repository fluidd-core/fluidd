import type { TemperaturePreset } from '@/store/config/types'

/** The G-code a temperature preset sends: each active heater and fan target, then its own G-code. */
export function presetCommands (preset: TemperaturePreset): string[] {
  const commands: string[] = []
  for (const key in preset.values ?? {}) {
    const item = preset.values[key]
    if (!item.active || item.value <= -1) continue
    if (item.type === 'heater') commands.push(`SET_HEATER_TEMPERATURE HEATER=${key} TARGET=${item.value}`)
    if (item.type === 'fan') commands.push(`SET_TEMPERATURE_FAN_TARGET TEMPERATURE_FAN=${key} TARGET=${item.value}`)
  }
  if (preset.gcode) commands.push(preset.gcode)
  return commands
}

/** "215° / 60°": the active heaters' targets, nozzle first. */
export function presetSummary (preset: TemperaturePreset): string {
  return Object.entries(preset.values ?? {})
    .filter(([, v]) => v.type === 'heater' && v.active && v.value > -1)
    .sort(([a], [b]) => (a === 'extruder' ? -1 : b === 'extruder' ? 1 : a.localeCompare(b)))
    .map(([, v]) => `${v.value}°`)
    .join(' / ')
}
