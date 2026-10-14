import type { Move } from '@/store/gcodePreview/types'

/**
 * Where the head is between the printer's updates.
 *
 * Klipper reports where the head is now (motion_report.live_position, its
 * speed and the extruder's) and where its queue ends (toolhead.position)
 * about four times a second. Drawn as they come, the model jumps; drawn
 * from toolhead.position, it runs ahead of the machine. So the live M1
 * predicts, and every report corrects it:
 *
 * - Printing a file Fluidd has parsed, the head follows the file's own
 *   moves. Each report is placed on the path (the move nearest the live
 *   position, among those the printer has read), and from there the head
 *   advances along the moves at their feed rates times the speed factor,
 *   never past what has been read. The part is drawn to that same point,
 *   so it grows under the nozzle rather than at the read position, which is
 *   seconds ahead.
 * - Otherwise (a jog, homing, a probe touch, a purge from a macro), the head
 *   carries on from its live position the way it was going between the last
 *   two reports, at its live speed, for at most a little longer than the
 *   wait for the next report, and no further than the end of the queue when
 *   that lies straight ahead. With only one report to go by, it heads for
 *   the end of the queue.
 */

export type Vec3 = [number, number, number]

/** Every move of a file, in order, for following a print. */
export interface MotionPath {
  /** Where each move ends. */
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  /** Seconds from the file's start to the end of each move, at 100% speed. */
  t: Float64Array;
  /** The file position each move's line starts at. */
  file: Float64Array;
  /** How many of the print's drawn segments (toolpath.ts) end at or before each move. */
  drawn: Uint32Array;
  /** Whether each move is one of those segments. */
  extrudes: Uint8Array;
  count: number;
}

/** The print's moves as a path, counting drawn segments exactly as toolpathFrom does, so the two agree. */
export function motionPathFrom (moves: readonly Move[]): MotionPath {
  const n = moves.length
  const path: MotionPath = {
    x: new Float32Array(n),
    y: new Float32Array(n),
    z: new Float32Array(n),
    t: new Float64Array(n),
    file: new Float64Array(n),
    drawn: new Uint32Array(n),
    extrudes: new Uint8Array(n),
    count: n
  }
  let x = 0
  let y = 0
  let z = 0
  let time = 0
  let drawn = 0
  let feed = 3000
  for (let i = 0; i < n; i++) {
    const m = moves[i]
    const nx = m.x ?? x
    const ny = m.y ?? y
    const nz = m.z ?? z
    if (m.f && m.f > 0) feed = m.f
    const length = Math.hypot(nx - x, ny - y, nz - z)
    const travel = length > 0 ? length : Math.abs(m.e ?? 0)
    time += travel / (feed / 60)
    if (m.e !== undefined && m.e > 0 && (m.x !== undefined || m.y !== undefined) && (nx !== x || ny !== y)) {
      drawn++
      path.extrudes[i] = 1
    }
    path.x[i] = nx
    path.y[i] = ny
    path.z[i] = nz
    path.t[i] = time
    path.file[i] = m.filePosition
    path.drawn[i] = drawn
    x = nx
    y = ny
    z = nz
  }
  return path
}

/** A place on the path: inside move `i`, a fraction `f` of the way along it. */
export interface PathPlace {
  i: number;
  f: number;
}

const startOf = (p: MotionPath, i: number): Vec3 => (i > 0 ? [p.x[i - 1], p.y[i - 1], p.z[i - 1]] : [p.x[0], p.y[0], p.z[0]])

/** Where a place on the path is, in the printer's millimetres. */
export function pointAt (p: MotionPath, at: PathPlace): Vec3 {
  const s = startOf(p, at.i)
  return [s[0] + (p.x[at.i] - s[0]) * at.f, s[1] + (p.y[at.i] - s[1]) * at.f, s[2] + (p.z[at.i] - s[2]) * at.f]
}

/** The last move the printer has read: the one whose line starts at or before `filePosition`. */
export function lastRead (p: MotionPath, filePosition: number): number {
  let lo = 0
  let hi = p.count - 1
  if (hi < 0 || p.file[0] > filePosition) return -1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (p.file[mid] <= filePosition) lo = mid
    else hi = mid - 1
  }
  return lo
}

/**
 * The place on the path nearest the live position, among the moves the
 * printer has read in the last few seconds of printing, and how far from
 * it the live position is. Z counts double, so a layer above or below,
 * which can pass over the same point, loses to the right one.
 */
export function locate (p: MotionPath, live: Vec3, filePosition: number, windowSeconds = 12): { at: PathPlace, distance: number } | null {
  const last = lastRead(p, filePosition)
  if (last < 0) return null
  let best: PathPlace | null = null
  let bestD = Infinity
  const floor = p.t[last] - windowSeconds
  for (let i = last; i >= 0 && (p.t[i] >= floor || i === last); i--) {
    const s = startOf(p, i)
    const dx = p.x[i] - s[0]
    const dy = p.y[i] - s[1]
    const dz = p.z[i] - s[2]
    const len2 = dx * dx + dy * dy + dz * dz
    let f = len2 > 0 ? ((live[0] - s[0]) * dx + (live[1] - s[1]) * dy + (live[2] - s[2]) * dz) / len2 : 1
    f = Math.min(1, Math.max(0, f))
    const ex = s[0] + dx * f - live[0]
    const ey = s[1] + dy * f - live[1]
    const ez = (s[2] + dz * f - live[2]) * 2
    const d = Math.sqrt(ex * ex + ey * ey + ez * ez)
    // Later moves win ties: the head is more likely near the end of what was read.
    if (d < bestD - 1e-6) {
      bestD = d
      best = { i, f }
    }
  }
  return best ? { at: best, distance: bestD } : null
}

/** The place `seconds` of printing (at 100%) on from `from`, but no further than move `limit`. */
export function advance (p: MotionPath, from: PathPlace, seconds: number, limit: number): PathPlace {
  if (seconds <= 0 || from.i >= p.count) return from
  const startT = (i: number) => (i > 0 ? p.t[i - 1] : 0)
  const goal = startT(from.i) + (p.t[from.i] - startT(from.i)) * from.f + seconds
  const top = Math.min(limit, p.count - 1)
  if (goal >= p.t[top]) return { i: top, f: 1 }
  // The first move ending at or after the goal.
  let lo = from.i
  let hi = top
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (p.t[mid] < goal) lo = mid + 1
    else hi = mid
  }
  const span = p.t[lo] - startT(lo)
  return { i: lo, f: span > 0 ? Math.min(1, Math.max(0, (goal - startT(lo)) / span)) : 1 }
}

/** How much of the print is drawn at a place: whole segments, and how far into the one being laid. */
export function drawnAt (p: MotionPath, at: PathPlace): { segments: number, partial: number } {
  if (!p.extrudes[at.i]) return { segments: p.drawn[at.i], partial: 0 }
  return { segments: p.drawn[at.i] - 1, partial: at.f }
}

/** One report from the printer. */
export interface MotionReport {
  /** When it arrived, ms (performance.now). */
  at: number;
  live: Vec3;
  /** mm/s. */
  velocity: number;
  /** mm/s of filament. */
  extruderVelocity: number;
  /** Where the queue ends (toolhead.position). */
  target: Vec3;
  /** M220, 1 is 100%. */
  speedFactor: number;
  /** The file's read position while printing; null otherwise. */
  filePosition: number | null;
}

/** How long past a report the head is moved on along the file without another. */
const HORIZON_S = 0.6
/** Off the file the next turn can't be known, so the head stops sooner: just past the next report's due time. */
const OFF_PATH_HORIZON_S = 0.35
/** Two reports further apart than this say nothing about which way the head is going now. */
const DIRECTION_GAP_MS = 600
/** Further than this from the file's path and the head isn't printing it (a purge, a macro): it is moved by its report alone. */
const ON_PATH_MM = 2.5

export interface Predicted {
  position: Vec3;
  /** On the file's path, and where. */
  place: PathPlace | null;
  /** Filament is flowing, here. */
  extruding: boolean;
  /** Still moving: keep drawing. */
  moving: boolean;
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const length = (a: Vec3) => Math.hypot(a[0], a[1], a[2])

/** The head between reports: a report, then the path or its live speed until the next. */
export class MotionPredictor {
  private report: MotionReport | null = null
  private previous: MotionReport | null = null
  private place: PathPlace | null = null
  /** Off the file: which way the head is going, and how far it can go that way. */
  private heading: Vec3 | null = null
  private reach = 0
  path: MotionPath | null = null

  setPath (path: MotionPath | null) {
    this.path = path
    this.place = null
  }

  /** The last report, or null before the first. */
  get last (): MotionReport | null {
    return this.report
  }

  observe (report: MotionReport) {
    this.previous = this.report
    this.report = report
    this.place = null
    if (this.path && report.filePosition !== null) {
      const found = locate(this.path, report.live, report.filePosition)
      if (found && found.distance <= ON_PATH_MM) this.place = found.at
    }
    this.aim(report)
  }

  /**
   * Which way the head goes off the file: the way it went between the last
   * two reports, stopping at the end of the queue if that lies straight
   * ahead (a jog, a probe's approach); or, with one report only, straight
   * for the end of the queue.
   */
  private aim (r: MotionReport) {
    const toTarget = sub(r.target, r.live)
    const toTargetLength = length(toTarget)
    const p = this.previous
    let heading: Vec3 | null = null
    if (p && r.at - p.at <= DIRECTION_GAP_MS) {
      const d = sub(r.live, p.live)
      const l = length(d)
      if (l > 0.05) heading = [d[0] / l, d[1] / l, d[2] / l]
    }
    if (!heading) {
      this.heading = toTargetLength > 1e-6 ? [toTarget[0] / toTargetLength, toTarget[1] / toTargetLength, toTarget[2] / toTargetLength] : null
      this.reach = toTargetLength
      return
    }
    const along = toTarget[0] * heading[0] + toTarget[1] * heading[1] + toTarget[2] * heading[2]
    const aside = length(sub(toTarget, [heading[0] * along, heading[1] * along, heading[2] * along]))
    this.heading = heading
    this.reach = along > 0 && aside < 1 ? along : Infinity
  }

  /** Where the head is at `now` (ms). */
  at (now: number): Predicted | null {
    const r = this.report
    if (!r) return null
    const dt = Math.max(0, Math.min(HORIZON_S, (now - r.at) / 1000))
    if (this.path && this.place && r.filePosition !== null) {
      const limit = lastRead(this.path, r.filePosition)
      const place = advance(this.path, this.place, dt * Math.max(0.01, r.speedFactor), limit)
      return {
        position: pointAt(this.path, place),
        place,
        extruding: !!this.path.extrudes[place.i] && r.velocity > 0,
        moving: r.velocity > 0 && dt < HORIZON_S
      }
    }
    const h = this.heading
    const ahead = Math.min(dt, OFF_PATH_HORIZON_S)
    const travel = h ? Math.min(this.reach, r.velocity * ahead) : 0
    return {
      position: h ? [r.live[0] + h[0] * travel, r.live[1] + h[1] * travel, r.live[2] + h[2] * travel] : [...r.live],
      place: null,
      extruding: r.extruderVelocity > 0.05,
      moving: !!h && r.velocity > 0 && travel < this.reach && dt < OFF_PATH_HORIZON_S
    }
  }
}
