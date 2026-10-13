import type { TemperaturePreset } from '@/store/config/types'
import type { Fan, OutputPin } from '@/store/printer/types'
import { yAtRow } from '@/services/machine/orientation'

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

/**
 * A material to load, as the picker lists it: the printer's material table
 * (Fluidd's presets, U5) first, then the panel's own (MuonUI's MATERIALS,
 * KAN-479) for any it has that the table doesn't, so both name the same
 * materials and agree on what is loaded.
 */
export interface MaterialChoice {
  name: string;
  nozzle: number | null;
  bed: number | null;
  colour: string;
  /** The preset it comes from, to heat for it as the table says. */
  presetId: number | null;
}

/** The panel's materials (MuonUI src/panel/data.ts MATERIALS): name, swatch, hot end and bed. */
export const PANEL_MATERIALS: Array<{ name: string, colour: string, nozzle: number, bed: number }> = [
  { name: 'PLA', colour: '#e8a53b', nozzle: 215, bed: 60 },
  { name: 'PETG', colour: '#5b7fd6', nozzle: 240, bed: 80 },
  { name: 'ABS', colour: '#dde3e3', nozzle: 250, bed: 100 },
  { name: 'ASA', colour: '#c9b48a', nozzle: 255, bed: 100 },
  { name: 'TPU', colour: '#3fb3ad', nozzle: 225, bed: 50 },
  { name: 'PA', colour: '#8a9597', nozzle: 260, bed: 80 },
  { name: 'PC', colour: '#9aa6a8', nozzle: 270, bed: 110 }
]

const sameName = (a: string, b: string) => a.trim().toUpperCase() === b.trim().toUpperCase()

/** Every material to choose from: the table's, then the panel's it lacks. */
export function materialChoices (materials: Material[]): MaterialChoice[] {
  const fromTable = materials.map(m => ({
    name: m.name,
    nozzle: m.nozzle,
    bed: m.bed,
    colour: PANEL_MATERIALS.find(p => sameName(p.name, m.name))?.colour ?? '#8a9597',
    presetId: m.id
  }))
  const extra = PANEL_MATERIALS
    .filter(p => !materials.some(m => sameName(m.name, p.name)))
    .map(p => ({ name: p.name, nozzle: p.nozzle, bed: p.bed, colour: p.colour, presetId: null }))
  return [...fromTable, ...extra]
}

/** What save_variables holds: the panel writes VALUE='"PLA"', which Klipper keeps as the string PLA. */
export function savedMaterialName (variables: unknown): string | null {
  const raw = (variables as { muon_material?: unknown } | undefined)?.muon_material
  if (typeof raw !== 'string') return null
  const name = raw.replace(/^"+|"+$/g, '').trim()
  return name || null
}

/** The choice called `name`, if there is one. */
export function choiceNamed (choices: MaterialChoice[], name: string | null): MaterialChoice | null {
  return name ? choices.find(c => sameName(c.name, name)) ?? null : null
}

/** Remembers the loaded material on the printer, exactly as the panel does, so either can change it. */
export function saveMaterialCommand (name: string): string {
  const safe = name.replace(/["'\\]/g, '').trim()
  return `SAVE_VARIABLE VARIABLE=muon_material VALUE='"${safe}"'`
}

/** Filament colours to choose from: the common ones, named as a spool's label names them. */
export const FILAMENT_COLOURS: Array<{ name: string, colour: string }> = [
  { name: 'White', colour: '#F2F2EE' },
  { name: 'Black', colour: '#202022' },
  { name: 'Grey', colour: '#8B8F94' },
  { name: 'Silver', colour: '#C3C7CC' },
  { name: 'Red', colour: '#D13438' },
  { name: 'Orange', colour: '#F07B22' },
  { name: 'Yellow', colour: '#F4C430' },
  { name: 'Green', colour: '#3A9F4F' },
  { name: 'Teal', colour: '#2FA8A0' },
  { name: 'Blue', colour: '#2F63C6' },
  { name: 'Purple', colour: '#7A47B3' },
  { name: 'Pink', colour: '#E673A8' },
  { name: 'Brown', colour: '#8A5A36' },
  { name: 'Natural', colour: '#E7DDC4' }
]

/** A colour as "#RRGGBB", from "#rrggbb", "rrggbb" or a quoted save_variables value; null for anything else. */
export function normaliseColour (value: unknown): string | null {
  if (typeof value !== 'string') return null
  const hex = value.replace(/^"+|"+$/g, '').trim().replace(/^#/, '')
  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : null
}

/** A colour's name from the list, or "Custom colour". */
export function colourName (colour: string | null): string {
  if (!colour) return ''
  return FILAMENT_COLOURS.find(c => c.colour === normaliseColour(colour))?.name ?? 'Custom colour'
}

/** The loaded colour; see docs/loaded-filament.md. Legacy spelling is read only. */
export function savedMaterialColour (variables: unknown): string | null {
  const vars = variables as Record<string, unknown> | undefined
  return normaliseColour(vars && 'muon_material_colour' in vars ? vars.muon_material_colour : vars?.muon_material_color)
}

/**
 * Remembers the loaded filament's colour on the printer, beside its material,
 * so Overview, Control and the slicer all show the same. Kept without its #,
 * which some G-code readers take for the start of a comment.
 */
export function saveMaterialColourCommand (colour: string): string {
  const hex = normaliseColour(colour)
  if (!hex) throw new Error(`not a colour: ${colour}`)
  return `SAVE_VARIABLE VARIABLE=muon_material_colour VALUE='"${hex.slice(1)}"'`
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

/**
 * Where a click on the plate, from 0 to 1 across and down, puts the head, to
 * 0.1 mm. The pad is the plate seen from above with its back at the top;
 * which Y that is depends on the machine (orientation.ts).
 */
export function plateToPosition (fx: number, fy: number, min: number[], max: number[]): [number, number] {
  const x = min[0] + clampTo(fx, 0, 1) * (max[0] - min[0])
  const y = yAtRow(clampTo(fy, 0, 1), min[1], max[1])
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

// -- Pro's tuning and outputs -------------------------------------------------

/** The shapers Klipper knows, in its order. */
export const SHAPER_TYPES = ['zv', 'mzv', 'zvd', 'ei', '2hump_ei', '3hump_ei']

export interface AxisShaper {
  type: string;
  /** Hz; 0 is off. */
  freq: number;
}

export type ShaperAxis = 'x' | 'y'

/**
 * What Klipper says the shapers are: SET_INPUT_SHAPER, with or without
 * values, answers "shaper_type_x:mzv shaper_freq_x:52.400
 * damping_ratio_x:0.100000 ..." (Klipper keeps no status of its own for
 * them).
 */
export function parseShaperReport (text: string): Partial<Record<ShaperAxis, AxisShaper>> {
  const found: Partial<Record<ShaperAxis, AxisShaper>> = {}
  for (const axis of ['x', 'y'] as const) {
    const match = new RegExp(`shaper_type_${axis}:(\\w+)\\s+shaper_freq_${axis}:([\\d.]+)`).exec(text)
    if (match) found[axis] = { type: match[1], freq: Number(match[2]) }
  }
  return found
}

/** An axis's shaper as printer.cfg sets it: shaper_type_x over shaper_type, and Klipper's mzv by default. */
export function configShaper (settings: Record<string, unknown> | undefined, axis: ShaperAxis): AxisShaper | null {
  if (!settings) return null
  const type = settings[`shaper_type_${axis}`] ?? settings.shaper_type ?? 'mzv'
  return { type: String(type), freq: Number(settings[`shaper_freq_${axis}`] ?? 0) }
}

export function shaperCommand (axis: ShaperAxis, shaper: AxisShaper): string {
  const a = axis.toUpperCase()
  return `SET_INPUT_SHAPER SHAPER_TYPE_${a}=${shaper.type} SHAPER_FREQ_${a}=${Number(shaper.freq.toFixed(2))}`
}

export type RetractionKey = 'retract_length' | 'retract_speed' | 'unretract_extra_length' | 'unretract_speed'

export function retractionCommand (key: RetractionKey, value: number): string {
  return `SET_RETRACTION ${key.toUpperCase()}=${value}`
}

export function sensorCommand (name: string, enabled: boolean): string {
  return `SET_FILAMENT_SENSOR SENSOR=${name} ENABLE=${enabled ? 1 : 0}`
}

/** An LED's brightness, 0 to 100: its brightest channel. */
export function ledPercent (colorData: number[][] | undefined): number {
  const first = colorData?.[0] ?? []
  return Math.round(Math.max(0, ...first) * 100)
}

/** Every channel of an LED at one brightness: white light, or as white as it gets. */
export function ledCommand (name: string, percent: number): string {
  const v = Math.round(percent) / 100
  return `SET_LED LED=${name} RED=${v} GREEN=${v} BLUE=${v} WHITE=${v}`
}
