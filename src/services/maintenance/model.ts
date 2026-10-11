/** The checks that keep prints coming out right, in the order Maintenance lists them. */
export type CheckId = 'bedMesh' | 'firstLayer' | 'shaper' | 'pid'

export type CheckTone = 'ok' | 'warn' | 'off'

export interface CheckStatus {
  tone: CheckTone;
  /** "Due · last run 41 days ago", "Good · 3 days ago", "Not run yet". */
  text: string;
  due: boolean;
}

const DAY = 86_400_000

/** After how long each check is due again. The bed mesh drifts soonest; vibration only moves with the printer. */
const DUE_AFTER_DAYS: Record<CheckId, number> = {
  bedMesh: 30,
  firstLayer: 60,
  shaper: 180,
  pid: 365
}

/** "today", "yesterday", "6 days ago". */
export function daysAgo (then: number, now: number): string {
  const days = Math.floor((now - then) / DAY)
  if (days < 1) return 'today'
  if (days < 2) return 'yesterday'
  return `${days} days ago`
}

/**
 * How a check stands from when it last ran here. Never run: the bed mesh
 * is due (every printer needs one), the others aren't yet, since the
 * printer's own defaults print well.
 */
export function checkStatus (id: CheckId, lastRun: number | undefined, now: number): CheckStatus {
  if (!lastRun) {
    if (id === 'bedMesh') return { tone: 'warn', text: 'Due · not run from here yet', due: true }
    return { tone: 'off', text: 'Not run yet', due: false }
  }
  const age = (now - lastRun) / DAY
  if (age > DUE_AFTER_DAYS[id]) return { tone: 'warn', text: `Due · last run ${daysAgo(lastRun, now)}`, due: true }
  return { tone: 'ok', text: `Good · ${daysAgo(lastRun, now)}`, due: false }
}

export interface MeshSummary {
  /** Highest point less lowest, in mm. */
  range: number;
  min: number;
  max: number;
  verdict: string;
  tone: CheckTone | 'err';
}

/** How flat the plate measured: the spread of the mesh, and what that means for printing. */
export function meshSummary (matrix: number[][] | undefined): MeshSummary | null {
  const values = (matrix ?? []).flat().filter(v => typeof v === 'number' && Number.isFinite(v))
  if (!values.length) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.round((max - min) * 1000) / 1000
  if (range <= 0.25) return { range, min, max, verdict: 'Flat enough to print well', tone: 'ok' }
  if (range <= 0.6) return { range, min, max, verdict: 'A little uneven; the mesh evens out the first layer', tone: 'warn' }
  return { range, min, max, verdict: 'Very uneven: check the plate sits flat and clean', tone: 'err' }
}

/** A mesh point in mm to two places, with no "-0.00" for a point a hair below zero. */
export function meshValue (value: number): string {
  return (Math.abs(value) < 0.005 ? 0 : value).toFixed(2)
}

/** A mesh point's colour: blue below level, green at level, amber above. */
export function meshColor (value: number, min: number, max: number): string {
  const span = Math.max(1e-6, max - min)
  const t = (value - min) / span
  // Blue (low) → teal → green (level) → yellow → amber (high).
  const stops: Array<[number, number, number]> = [[59, 130, 246], [45, 180, 190], [87, 192, 138], [200, 200, 80], [232, 150, 60]]
  const pos = t * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(pos))
  const f = pos - i
  const [a, b] = [stops[i], stops[i + 1]]
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * f))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

/** What Klipper holds that a check changes: the probed mesh, and the results it hasn't saved yet. */
export interface CheckEvidence {
  /** The probed mesh, as JSON, so two can be compared. */
  mesh: string;
  /** SAVE_CONFIG's pending results: section, then key, then value. */
  pending: Record<string, Record<string, string>>;
}

/** The pending results that are new or changed since `before`, as section and key. */
function changedResults (before: CheckEvidence, after: CheckEvidence): Array<[string, string]> {
  const changed: Array<[string, string]> = []
  for (const [section, values] of Object.entries(after.pending ?? {})) {
    for (const [key, value] of Object.entries(values ?? {})) {
      if (before.pending?.[section]?.[key] !== value) changed.push([section, key])
    }
  }
  return changed
}

/**
 * Whether a check finished with a result: a new mesh for the bed, or the
 * setting the check writes waiting to be saved. Stopping a check halfway,
 * or one that errors, changes neither, so it doesn't count as run.
 */
export function checkProduced (id: CheckId, before: CheckEvidence, after: CheckEvidence): boolean {
  if (id === 'bedMesh') return after.mesh !== before.mesh && after.mesh !== '' && after.mesh !== '[]'
  const changed = changedResults(before, after)
  if (id === 'pid') return changed.some(([, key]) => key === 'pid_kp')
  if (id === 'shaper') return changed.some(([section, key]) => section === 'input_shaper' && key.startsWith('shaper_freq'))
  return changed.some(([, key]) => key === 'z_offset' || key === 'position_endstop')
}

export interface CheckContext {
  /** The G-code commands the printer knows, by name. */
  commands: Record<string, unknown>;
  homed: boolean;
  /** The nozzle temperature heater tuning heats to. */
  nozzleTarget: number;
}

/**
 * The G-code a check runs, homing first where it moves, or null when the
 * printer can't run it (no probe, no accelerometer).
 */
export function checkCommand (id: CheckId, c: CheckContext): string | null {
  const home = c.homed ? '' : 'G28\n'
  const knows = (command: string) => command in c.commands
  switch (id) {
    case 'bedMesh':
      return knows('BED_MESH_CALIBRATE') ? `${home}BED_MESH_CALIBRATE` : null
    case 'firstLayer':
      if (knows('PROBE_CALIBRATE')) return `${home}PROBE_CALIBRATE`
      return knows('Z_ENDSTOP_CALIBRATE') ? `${home}Z_ENDSTOP_CALIBRATE` : null
    case 'shaper':
      return knows('SHAPER_CALIBRATE') ? `${home}SHAPER_CALIBRATE` : null
    case 'pid':
      // A printer's own tuning macro knows its heater and temperature (the M1's tunes at 220°C).
      if (knows('CALIBRATE_HEATING_HOTEND')) return 'CALIBRATE_HEATING_HOTEND'
      return knows('PID_CALIBRATE') ? `PID_CALIBRATE HEATER=extruder TARGET=${Math.round(c.nozzleTarget)}` : null
  }
}

/** The heights Klipper reported as it probed, in order, from its "probe at X,Y is z=Z" lines. */
export function probedHeights (messages: string[]): number[] {
  const heights: number[] = []
  for (const message of messages) {
    const match = /probe at -?[\d.]+,\s*-?[\d.]+ is z=(-?[\d.]+)/.exec(message)
    if (match) heights.push(+match[1])
  }
  return heights
}

/** The mesh's points across and deep, from bed_mesh's probe_count: one number is both. */
export function probeCount (setting: unknown): [number, number] | null {
  const counts = (Array.isArray(setting) ? setting : [setting]).map(Number).filter(n => Number.isInteger(n) && n > 0)
  if (!counts.length) return null
  return [counts[0], counts[1] ?? counts[0]]
}

/**
 * The mesh while it's measured: Klipper probes row by row from the front,
 * left to right then back, so the nth height lands in a known cell. Rows
 * not reached yet are null.
 */
export function liveMesh (heights: number[], columns: number, rows: number): Array<Array<number | null>> {
  const mesh: Array<Array<number | null>> = Array.from({ length: rows }, () => Array<number | null>(columns).fill(null))
  heights.slice(0, columns * rows).forEach((z, n) => {
    const row = Math.floor(n / columns)
    const step = n % columns
    mesh[row][row % 2 === 0 ? step : columns - 1 - step] = z
  })
  return mesh
}

// -- Pro's Bed mesh page ------------------------------------------------------

export interface ProbeAccuracy {
  maximum: number;
  minimum: number;
  range: number;
  average: number;
  median: number;
  stddev: number;
}

const ACCURACY = /probe accuracy results: maximum (-?[\d.]+), minimum (-?[\d.]+), range (-?[\d.]+), average (-?[\d.]+), median (-?[\d.]+), standard deviation (-?[\d.]+)/

/** PROBE_ACCURACY's last line: "probe accuracy results: maximum 2.003750, minimum 1.995000, range 0.008750, ...". */
export function parseProbeAccuracy (text: string): ProbeAccuracy | null {
  const m = ACCURACY.exec(text)
  if (!m) return null
  const [maximum, minimum, range, average, median, stddev] = m.slice(1).map(Number)
  return { maximum, minimum, range, average, median, stddev }
}

/** How repeatable the probe is, by its standard deviation: a few microns is good; much more and the first layer wanders. */
export function probeVerdict (stddev: number): { tone: CheckTone, text: string } {
  if (stddev <= 0.003) return { tone: 'ok', text: 'Repeatable: it lands within a few microns each time.' }
  if (stddev <= 0.006) return { tone: 'warn', text: 'A little spread. Clean the nozzle tip and run it again.' }
  return { tone: 'warn', text: 'Spread out. Clean the nozzle, check nothing is loose on the head, and run it again.' }
}

/** A mesh profile's name as Klipper takes it in BED_MESH_PROFILE: letters, numbers, spaces, dots, dashes and underscores. */
export function validProfileName (name: string): boolean {
  return /^[\w][\w .-]*$/.test(name.trim())
}

export function meshProfileCommand (action: 'LOAD' | 'SAVE' | 'REMOVE', name: string): string {
  return `BED_MESH_PROFILE ${action}="${name.trim()}"`
}

/** The middle of the probed area (bed_mesh's mesh_min to mesh_max), else of the axes. */
export function bedMiddle (meshMin: number[] | undefined, meshMax: number[] | undefined, axisMin: number[], axisMax: number[]): [number, number] {
  const [lo, hi] = meshMin?.length === 2 && meshMax?.length === 2 ? [meshMin, meshMax] : [axisMin, axisMax]
  return [Math.round((lo[0] + hi[0]) / 2), Math.round((lo[1] + hi[1]) / 2)]
}

/**
 * PROBE_ACCURACY probes wherever the head is, so it goes to the middle of
 * the bed first, homing if it hasn't.
 */
export function probeAccuracyScript (homed: boolean, middle: [number, number]): string {
  return [...(homed ? [] : ['G28']), 'G90', `G1 X${middle[0]} Y${middle[1]} F6000`, 'PROBE_ACCURACY'].join('\n')
}
