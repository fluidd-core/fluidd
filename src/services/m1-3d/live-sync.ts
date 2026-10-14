import type { ModelPose } from './pose'
import { MotionPredictor, drawnAt, pointAt, type MotionPath, type MotionReport, type Vec3 } from './motion'
import { AccessoryMotion, type AccessoryFrame } from './accessory-motion'
import type { Accessories } from './accessories'

/**
 * The live M1 kept in step with one printer: where its head and bed are
 * between reports (motion.ts), how much of the print is on the plate, and
 * the lines the printer laid that no file drew (a purge, a macro's
 * extrusion, a print whose file Fluidd hasn't read). It belongs to the
 * printer, not to a view, so leaving the page and coming back keeps them.
 * The viewer asks it, every frame it draws, what to show.
 */

/** Further than this from where the head was drawn, a report is a jump, not a correction. */
const SNAP_MM = 25
/** A correction fades over about this long, so the head never jumps by a millimetre or two. */
const SMOOTH_MS = 90
/** Reports older than this, and the printer's own position elsewhere, and the reports have stopped. */
const STALE_MS = 3000
/** The most lines kept on the plate; past it the oldest half go. */
export const MAX_TRACE = 20000
/** Points closer than this are one point. */
const TRACE_STEP_MM = 0.2

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const length = (a: Vec3) => Math.hypot(a[0], a[1], a[2])

/**
 * Filament the printer laid that no file drew, as line segments in the
 * printer's millimetres: six numbers a segment. It grows from the reports,
 * so it is as fine as they are (four a second), which is plenty for a
 * purge line.
 */
export class PlateTrace {
  readonly positions = new Float32Array(MAX_TRACE * 6)
  count = 0
  /** Bumped when lines already drawn change (cleared, or the oldest dropped), so a view loads them all again. */
  version = 0
  private last: Vec3 | null = null

  /** Where the line being laid ends, or null between lines. */
  get tip (): Vec3 | null {
    return this.last
  }

  /** Lays filament from the last point to `p`. */
  add (p: Vec3) {
    const last = this.last
    if (!last) {
      this.last = [...p]
      return
    }
    if (length(sub(p, last)) < TRACE_STEP_MM) return
    if (this.count >= MAX_TRACE) {
      const keep = MAX_TRACE >> 1
      this.positions.copyWithin(0, (this.count - keep) * 6, this.count * 6)
      this.count = keep
      this.version++
    }
    this.positions.set([last[0], last[1], last[2], p[0], p[1], p[2]], this.count * 6)
    this.count++
    this.last = [...p]
  }

  /** The head stopped laying filament: the next point starts a new line. */
  lift () {
    this.last = null
  }

  clear () {
    this.count = 0
    this.last = null
    this.version++
  }
}

/** What to draw this frame. */
export interface SyncFrame {
  /** Where the head and the bed are, with the printer's homed axes. */
  pose: ModelPose;
  /** How many of the print's segments are on the plate. */
  printDone: number;
  /** The line being laid right now, from where it began to the nozzle, or null. */
  nib: [Vec3, Vec3] | null;
  /** Still moving: draw again soon. */
  moving: boolean;
  /** The plate, umbilical, filament and spool as they are now. */
  accessories: AccessoryFrame;
  /** The part was taken off the plate; stop drawing it until the next print. */
  partGone: boolean;
}

export class LiveSync {
  readonly predictor = new MotionPredictor()
  readonly trace = new PlateTrace()
  readonly accessories = new AccessoryMotion()
  partGone = false
  private path: MotionPath | null = null
  private pose: ModelPose = { x: null, y: null, z: null, led: false, progress: 0 }
  /** The segments the file says are done (read ahead of the nozzle); used only until the head is found on the file. */
  private fileDone = 0
  /** The segments done as far as the head has got along the file; it never goes back within a print. */
  private placeDone: number | null = null
  private shown: Vec3 | null = null
  private offset: Vec3 = [0, 0, 0]
  private offsetAt = 0

  /** Where the printer says it is (toolhead.position), which axes are homed, the light. */
  setPose (pose: ModelPose) {
    this.pose = pose
  }

  /** The file being printed, as a path to follow, or null. */
  setPath (path: MotionPath | null) {
    if (path === this.path) return
    this.path = path
    this.placeDone = null
    this.predictor.setPath(path)
  }

  /** The segments done by the file's read position, for when the head can't be followed along it. */
  setFileDone (segments: number) {
    this.fileDone = segments
  }

  /** The current accessory signals for this printer. */
  setAccessories (a: Accessories, now: number, hasPart: boolean): void {
    const carriesPrint = !this.partGone && (hasPart || this.trace.count > 0)
    if (this.accessories.last?.plateOn === false && a.plateOn === true) this.partGone = true
    this.accessories.set(a, now, carriesPrint)
  }

  /** A new print puts a part back on the plate. */
  newPrint (): void {
    this.partGone = false
  }

  private homed (): boolean {
    return this.pose.x !== null && this.pose.y !== null && this.pose.z !== null
  }

  /** A report from the printer: correct the head, and lay filament where no file draws it. */
  observe (report: MotionReport) {
    const before = this.shown
    this.predictor.observe(report)
    const now = this.predictor.at(report.at)
    if (before && now) {
      const off = sub(before, now.position)
      this.offset = length(off) < SNAP_MM ? off : [0, 0, 0]
      this.offsetAt = report.at
    }
    if (this.homed() && report.extruderVelocity > 0.05 && !now?.place) this.trace.add(report.live)
    else this.trace.lift()
  }

  /** Whether the last report agrees with where the printer says it is, on the axes it knows. */
  private agrees (live: Vec3): boolean {
    const p = this.pose
    return [p.x, p.y, p.z].every((v, i) => v === null || Math.abs(v - live[i]) < 0.5)
  }

  frame (now: number): SyncFrame {
    const last = this.predictor.last
    const predicted = last && (now - last.at < STALE_MS || this.agrees(last.live)) ? this.predictor.at(now) : null
    let position: Vec3 | null = null
    let settling = false
    if (predicted) {
      const k = Math.exp(-Math.max(0, now - this.offsetAt) / SMOOTH_MS)
      position = [
        predicted.position[0] + this.offset[0] * k,
        predicted.position[1] + this.offset[1] * k,
        predicted.position[2] + this.offset[2] * k
      ]
      settling = length(this.offset) * k > 0.02
    }
    this.shown = position
    const pose = this.pose
    const shown: ModelPose = {
      ...pose,
      x: pose.x === null ? null : position ? position[0] : pose.x,
      y: pose.y === null ? null : position ? position[1] : pose.y,
      z: pose.z === null ? null : position ? position[2] : pose.z
    }

    let nib: [Vec3, Vec3] | null = null
    let printDone = this.fileDone
    if (this.path) {
      const place = predicted?.place
      if (place) {
        const drawn = drawnAt(this.path, place)
        if (this.placeDone === null || drawn.segments >= this.placeDone) {
          this.placeDone = drawn.segments
          if (drawn.partial > 0) {
            const z = this.path.z[place.i]
            const from = pointAt(this.path, { i: place.i, f: 0 })
            const to = pointAt(this.path, place)
            nib = [[from[0], from[1], z], [to[0], to[1], z]]
          }
        }
      }
      if (this.placeDone !== null) printDone = this.placeDone
    }
    const tip = this.trace.tip
    if (!nib && tip && predicted && !predicted.place && predicted.extruding && position) nib = [tip, position]

    return {
      pose: shown,
      printDone,
      nib,
      moving: !!predicted?.moving || settling,
      accessories: this.accessories.frame(now),
      partGone: this.partGone
    }
  }
}

const syncs = new Map<string, LiveSync>()

/** The printer's sync, made the first time it's asked for. */
export function liveSyncFor (printer: string): LiveSync {
  let sync = syncs.get(printer)
  if (!sync) {
    sync = new LiveSync()
    syncs.set(printer, sync)
  }
  return sync
}
