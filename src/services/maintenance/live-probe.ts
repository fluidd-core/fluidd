/**
 * Following a bed measurement as it happens, from what Klipper prints.
 *
 * Every touch of the plate prints a line, worded one of two ways:
 *   "probe at 10.000,10.000 is z=0.012500"                   (older Klipper)
 *   "probe: at 10.000,10.000 bed will contact at z=0.012500" (current, and the M1's)
 * A PROBE command (the M1 homes Z with two) adds its result after its touches:
 *   "Result: at 100.000,90.000 estimate contact at z=0.010000"
 * The M1 touches each mesh point twice, so touches are grouped by where they
 * were, and a group that ends in a PROBE result belongs to homing, not the
 * mesh. Points are placed on the grid by where they are, never by their
 * order, so a mesh of any size or shape fills in the right cells.
 */

export interface ProbeTouch {
  kind: 'touch' | 'result';
  x: number;
  y: number;
  z: number;
  /** When the line arrived, seconds since 1970 (Fluidd's console time). */
  time: number;
}

export interface MeshPoint {
  x: number;
  y: number;
  /** The average of its touches, as Klipper's samples_result: average. */
  z: number;
  touches: number;
  time: number;
}

/** A mesh's points across (X) and deep (Y), each list ascending. */
export interface MeshLayout {
  xs: number[];
  ys: number[];
}

const TOUCH = /\bprobe:? at (-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?) (?:is|bed will contact at) z=(-?\d+(?:\.\d+)?)/
const RESULT = /\bResult: at (-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?) estimate contact at z=(-?\d+(?:\.\d+)?)/

/** One console line as a touch or a PROBE result, or null. */
export function parseProbeLine (message: string, time = 0): ProbeTouch | null {
  const result = RESULT.exec(message)
  if (result) return { kind: 'result', x: +result[1], y: +result[2], z: +result[3], time }
  const touch = TOUCH.exec(message)
  if (touch) return { kind: 'touch', x: +touch[1], y: +touch[2], z: +touch[3], time }
  return null
}

const same = (a: { x: number, y: number }, b: { x: number, y: number }) => Math.abs(a.x - b.x) < 0.05 && Math.abs(a.y - b.y) < 0.05

/**
 * The touches that measured the mesh, one point per place: touches in a row
 * at the same X,Y are one point, and those a PROBE result then reports (Z
 * homing, or a single PROBE) are left out.
 */
export function meshPoints (lines: ProbeTouch[]): MeshPoint[] {
  const groups: ProbeTouch[][] = []
  for (const line of lines) {
    const last = groups[groups.length - 1]
    if (line.kind === 'result') {
      if (last && last[0].kind === 'touch' && same(last[0], line)) groups.pop()
      continue
    }
    if (last && same(last[0], line)) last.push(line)
    else groups.push([line])
  }
  return groups.map(g => ({
    x: g[0].x,
    y: g[0].y,
    z: g.reduce((s, t) => s + t.z, 0) / g.length,
    touches: g.length,
    time: g[g.length - 1].time
  }))
}

/** How many PROBE results came in: the M1's Z homing touches the plate twice. */
export function homingTouches (lines: ProbeTouch[]): number {
  return lines.filter(l => l.kind === 'result').length
}

/** The distinct values of a list, within 0.5 mm, ascending. */
function distinct (values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b)
  const out: number[] = []
  for (const v of sorted) if (!out.length || v - out[out.length - 1] > 0.5) out.push(v)
  return out
}

/** Every point a mesh will touch, in any order. */
export type MeshPlan = Array<[number, number]>

/** The points Klipper lays out for a mesh from its settings: evenly spaced from min to max. */
export function planFromSettings (min: unknown, max: unknown, count: [number, number] | null): MeshPlan | null {
  const lo = Array.isArray(min) ? min.map(Number) : []
  const hi = Array.isArray(max) ? max.map(Number) : []
  if (!count || lo.length < 2 || hi.length < 2 || [...lo, ...hi].some(v => !Number.isFinite(v))) return null
  const along = (a: number, b: number, n: number) => (n < 2 ? [a] : Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1)))
  const plan: MeshPlan = []
  for (const y of along(lo[1], hi[1], count[1])) for (const x of along(lo[0], hi[0], count[0])) plan.push([x, y])
  return plan
}

/** A list of [x, y] pairs, as the M1's mesh plan publishes them, or null. */
export function planFrom (value: unknown): MeshPlan | null {
  if (!Array.isArray(value) || !value.length) return null
  const plan = value.map(p => (Array.isArray(p) ? [Number(p[0]), Number(p[1])] : [NaN, NaN]) as [number, number])
  return plan.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y)) ? plan : null
}

/**
 * The first plan that has every point measured so far in it, so the whole
 * grid can show from the first touch. The M1's own plan comes first (a
 * print start meshes the print's region, and moves points out of the
 * plate's no-go area), then the printer's mesh settings.
 */
export function choosePlan (points: MeshPoint[], plans: Array<MeshPlan | null>): MeshPlan | null {
  for (const plan of plans) {
    // Within half a millimetre: bed_mesh rounds its spacing down to 0.01 mm.
    if (plan && points.every(p => plan.some(([x, y]) => Math.abs(p.x - x) <= 0.5 && Math.abs(p.y - y) <= 0.5))) return plan
  }
  return null
}

/**
 * The grid's columns (X) and rows (Y). A point moved off the grid (out of
 * a no-go area) appears once, so with two or more rows a value has to be
 * shared by two points to make a column or a row of its own.
 */
export function meshLayout (points: Array<{ x: number, y: number }>): MeshLayout {
  const along = (values: number[], others: number[]) => {
    const all = distinct(values)
    if (distinct(others).length < 2) return all
    const shared = all.filter(v => values.filter(w => Math.abs(w - v) <= 0.5).length >= 2)
    return shared.length ? shared : all
  }
  return {
    xs: along(points.map(p => p.x), points.map(p => p.y)),
    ys: along(points.map(p => p.y), points.map(p => p.x))
  }
}

/** The grid so far, rows by Y ascending (as Klipper's probed_matrix), cells by X ascending; null where not measured yet. */
export function liveGrid (points: MeshPoint[], layout: MeshLayout): Array<Array<number | null>> {
  const grid: Array<Array<number | null>> = layout.ys.map(() => layout.xs.map(() => null))
  const spacing = (list: number[]) => list.slice(1).reduce((m, v, i) => Math.min(m, v - list[i]), Infinity)
  const reach = (list: number[]) => (list.length > 1 ? spacing(list) / 2 : 0.5)
  const nearest = (v: number, list: number[]) => {
    let best = -1
    let gap = Infinity
    list.forEach((g, i) => {
      if (Math.abs(g - v) < gap) { gap = Math.abs(g - v); best = i }
    })
    return gap <= reach(list) ? best : -1
  }
  for (const p of points) {
    const row = nearest(p.y, layout.ys)
    const col = nearest(p.x, layout.xs)
    if (row >= 0 && col >= 0) grid[row][col] = p.z
  }
  return grid
}

export type MeshPhase = 'heating' | 'homing' | 'measuring' | 'finishing'

export interface MeshProgress {
  phase: MeshPhase;
  /** What the printer is doing now, in a few words. */
  text: string;
  /** The points measured so far, and how many there will be when that's known. */
  done: number;
  total: number | null;
}

/**
 * Where a bed measurement has got to: warming the plate first if it was
 * asked to, homing (with the touches that find the plate on a load cell
 * printer), then each point, then working out the mesh.
 */
export function meshProgress (s: {
  points: MeshPoint[];
  total: number | null;
  homingTouches: number;
  /** Whether X, Y and Z were all homed when the measurement began: then nothing homes first. */
  homedAtStart: boolean;
  bed: { temperature: number, target: number } | null;
}): MeshProgress {
  const done = s.points.length
  const total = s.total && s.total >= done ? s.total : null
  if (!done) {
    if (s.bed && s.bed.target > 0 && s.bed.temperature < s.bed.target - 2) {
      return { phase: 'heating', text: `Warming the plate to ${Math.round(s.bed.target)}°C`, done, total }
    }
    const touches = s.homingTouches
    if (s.homedAtStart && !touches) return { phase: 'homing', text: 'Moving to the first point', done, total }
    return {
      phase: 'homing',
      text: touches ? `Homing: finding the plate (touch ${touches})` : 'Homing',
      done,
      total
    }
  }
  if (total !== null && done >= total) return { phase: 'finishing', text: 'Working out the mesh', done, total }
  const last = s.points[done - 1]
  const sign = last.z > 0 ? '+' : last.z < 0 ? '−' : ''
  return {
    phase: 'measuring',
    text: `Touching point ${done + 1}${total ? ` of ${total}` : ''} · the last was ${sign}${Math.abs(last.z).toFixed(3)} mm`,
    done,
    total
  }
}
