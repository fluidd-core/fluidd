import type { Move } from '@/store/gcodePreview/types'

/**
 * What Slow, Normal and Fast mean while printing.
 *
 * Klipper's only print-wide speed control is M220, a feed rate factor.
 * Acceleration can't be scaled with it (a slicer sets acceleration per
 * feature with M204, which would undo a change at the next one), so every
 * choice here is a feed rate, and its words say what that does:
 *
 * - **Normal** is the print as it was sliced: 100%.
 * - **Slow** is half speed: quieter, and kinder to tall, thin or wobbly
 *   parts and to a first layer that isn't sticking.
 * - **Fast** is as fast as the nozzle can melt this filament for this
 *   print: the print's own peak flow (from its G-code) against the
 *   material's limit (the slicer's own value in the file, else a table),
 *   up to 150%. A print sliced at the limit already has no Fast: going
 *   faster would only starve it of plastic.
 */

/** Hot-end melt limits by material, mm³/s, for a 0.4 mm nozzle, when the file doesn't say. */
export const MATERIAL_MAX_FLOW: Record<string, number> = {
  PLA: 15, PETG: 10, ABS: 15, ASA: 15, TPU: 3.5, PA: 8, PC: 10
}

export const SLOW_PERCENT = 50
export const FAST_CAP_PERCENT = 150
/** Below this much headroom, Fast isn't worth offering. */
const FAST_MIN_PERCENT = 110

/**
 * The print's peak flow, mm³/s: the flow that the busiest 5% of its
 * extruding time runs at, as sliced (so a few fast moves don't decide it).
 * Null without feed rates.
 */
export function peakFlow (moves: readonly Move[], filamentDiameter = 1.75): number | null {
  const area = Math.PI * (filamentDiameter / 2) ** 2
  const samples: Array<[number, number]> = [] // [flow, seconds]
  let x = 0
  let y = 0
  let z = 0
  for (const m of moves) {
    const nx = m.x ?? x
    const ny = m.y ?? y
    const nz = m.z ?? z
    const length = Math.hypot(nx - x, ny - y, nz - z)
    if (m.e !== undefined && m.e > 0 && length > 0.05 && m.f && m.f > 0) {
      const seconds = length / (m.f / 60)
      samples.push([m.e * area / seconds, seconds])
    }
    x = nx
    y = ny
    z = nz
  }
  if (!samples.length) return null
  samples.sort((a, b) => b[0] - a[0])
  const total = samples.reduce((s, [, t]) => s + t, 0)
  let acc = 0
  for (const [flow, t] of samples) {
    acc += t
    if (acc >= total * 0.05) return flow
  }
  return samples[samples.length - 1][0]
}

/** The slicer's melt limit, from the settings it writes into the file: "; filament_max_volumetric_speed = 12". */
export function fileMaxFlow (gcode: string): number | null {
  const m = /^;\s*(?:filament_max_volumetric_speed|max_volumetric_speed|filament_max_volumetric_flow)\s*=\s*([\d.]+)/m.exec(gcode)
  const v = m ? Number(m[1]) : NaN
  return Number.isFinite(v) && v > 0 ? v : null
}

/** The table's melt limit for a material, by name. */
export function materialMaxFlow (material: string | null | undefined): number | null {
  if (!material) return null
  return MATERIAL_MAX_FLOW[material.trim().toUpperCase().split(/[\s;,]/)[0]] ?? null
}

/** Fast's factor for a print, in percent, or null when it has no room to go faster. */
export function fastPercent (peak: number | null, maxFlow: number | null): number | null {
  if (peak === null || maxFlow === null || peak <= 0) return 125
  const headroom = Math.floor(maxFlow / peak * 20) / 20 * 100
  const percent = Math.min(FAST_CAP_PERCENT, Math.round(headroom))
  return percent >= FAST_MIN_PERCENT ? percent : null
}

/**
 * About how long is left at another speed. Only the moving scales with
 * it; heating, homing and slow corners don't, so a quarter of the time is
 * taken as fixed.
 */
export function leftAt (secondsLeft: number, currentPercent: number, percent: number): number {
  return secondsLeft * (0.25 + 0.75 * currentPercent / percent)
}

export interface SpeedChoice {
  label: 'Slow' | 'Normal' | 'Fast';
  percent: number;
  /** What it does, in a few words. */
  note: string;
}

/** Slow, Normal and Fast for this print; Fast left out when it can't go faster. */
export function speedChoices (fast: number | null, known: boolean): SpeedChoice[] {
  const out: SpeedChoice[] = [
    { label: 'Slow', percent: SLOW_PERCENT, note: 'Half speed: quieter, kinder to tall or wobbly parts' },
    { label: 'Normal', percent: 100, note: 'As it was sliced' }
  ]
  if (fast !== null) {
    out.push({
      label: 'Fast',
      percent: fast,
      note: known ? `As fast as the nozzle can melt it: ${fast}%` : 'About a quarter faster where the printer can keep up'
    })
  }
  return out
}
