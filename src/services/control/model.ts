import type { TemperaturePreset } from '@/store/config/types'
import type { Fan, OutputPin } from '@/store/printer/types'

/** Slow, Normal and Fast (U4): the print's speed factor, the same three on the panel and in the app. */
export const SPEED_PRESETS = [
  { label: 'Slow', percent: 75 },
  { label: 'Normal', percent: 100 },
  { label: 'Fast', percent: 125 }
] as const

/** The preset a speed factor is, or "Custom 110%". */
export function speedName (percent: number): string {
  const preset = SPEED_PRESETS.find(p => p.percent === Math.round(percent))
  return preset ? preset.label : `Custom ${Math.round(percent)}%`
}

/** One material's two temperatures, from a preset (U5: one table per printer). */
export interface Material {
  id: number;
  name: string;
  nozzle: number | null;
  bed: number | null;
}

function heaterTarget (preset: TemperaturePreset, heater: string): number | null {
  const v = preset.values?.[heater]
  return v && v.type === 'heater' && v.active && v.value > -1 ? v.value : null
}

/** The presets that set the nozzle, as materials. */
export function materialsFrom (presets: TemperaturePreset[], extruder = 'extruder', bed = 'heater_bed'): Material[] {
  return presets
    .map(p => ({ id: p.id, name: p.name, nozzle: heaterTarget(p, extruder), bed: heaterTarget(p, bed) }))
    .filter(m => m.nozzle !== null)
}

/** The material whose temperatures the heaters are set to now, if any. */
export function materialInUse (materials: Material[], nozzleTarget: number, bedTarget: number): Material | null {
  if (!nozzleTarget) return null
  return materials.find(m => m.nozzle === Math.round(nozzleTarget) && (m.bed === null || m.bed === Math.round(bedTarget))) ?? null
}

/**
 * The next target for a heater's − and + buttons: 5° a step, Off below the
 * lowest useful heat, and a jump from Off straight to that heat (no one
 * wants a nozzle at 5°).
 */
export function stepTarget (target: number, direction: 1 | -1, floor: number, max: number, step = 5): number {
  if (direction === 1) {
    if (target < floor) return floor
    return Math.min(max, target + step)
  }
  if (target <= floor) return 0
  return Math.max(floor, target - step)
}

/** A move that stays on the machine: Klipper refuses one past its limits, so it is cut short first. */
export function clampTo (value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Where a click on the plate, from 0 to 1 across and down, puts the head, to 0.1 mm. */
export function plateToPosition (fx: number, fy: number, min: number[], max: number[]): [number, number] {
  const x = min[0] + clampTo(fx, 0, 1) * (max[0] - min[0])
  // The pad is drawn with Y up, as the plate is seen from the front.
  const y = min[1] + (1 - clampTo(fy, 0, 1)) * (max[1] - min[1])
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10]
}

/** The output that is the printer's lights: an output pin or LED called light, lights, led or caselight. */
export function lightsOutput<T extends { name: string }> (outputs: T[]): T | null {
  return outputs.find(o => /(^|_)(case_?)?lights?($|_)|^leds?$|^caselight$/i.test(o.name)) ?? null
}

/** A fan's speed, 0 to 100. */
export function fanPercent (fan: Pick<Fan, 'speed' | 'config'>): number {
  if (!fan.speed) return 0
  return Math.round(fan.speed / (fan.config?.max_power || 1) * 100)
}

/** The G-code that sets a fan the user controls to `percent`. */
export function fanCommand (fan: Pick<Fan, 'type' | 'name'>, percent: number): string | null {
  if (fan.type === 'fan') return `M106 S${Math.ceil(percent * 2.55)}`
  if (fan.type === 'fan_generic') return `SET_FAN_SPEED FAN=${fan.name} SPEED=${percent / 100}`
  return null
}

/** The G-code that sets an output pin to `percent`, or on and off for one that only switches. */
export function pinCommand (pin: Pick<OutputPin, 'name' | 'scale' | 'pwm'>, value: number | boolean): string {
  const target = typeof value === 'boolean'
    ? (value ? pin.scale : 0)
    : Math.round(value * pin.scale) / 100
  return `SET_PIN PIN=${pin.name} VALUE=${target}`
}

/**
 * A pin's level, 0 to 100. Klipper reports an output_pin's value already
 * divided by its scale (0 to 1), whatever the scale; SET_PIN takes it in
 * scaled units (pinCommand).
 */
export function pinPercent (value: number): number {
  return Math.round(value * 100)
}

/** The lengths offered to extrude or retract: those within the extruder's max_extrude_only_distance. */
export function extrudeLengths (max: number): number[] {
  const lengths = [5, 10, 25, 50].filter(v => v <= max)
  return lengths.length ? lengths : [Math.floor(max * 10) / 10]
}

/** Why the extruder can't move filament now, in words, or null when it can. */
export function extrudeBlocked (temperature: number, minTemp: number, canExtrude?: boolean): string | null {
  if (canExtrude || temperature >= minTemp) return null
  return `Heat the nozzle first · it's at ${Math.round(temperature)}°, it needs ${Math.round(minTemp)}°`
}
