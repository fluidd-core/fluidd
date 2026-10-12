import { meshPoints, type ProbeTouch } from '@/services/maintenance/live-probe'

/**
 * What the live M1 shows besides where its parts are: the base's round
 * screen, the two LED strips down the trough, and the touches of the plate.
 * The model's own contract for these is m1-model's STATE.md.
 */

export type ScreenStatus = 'idle' | 'printing' | 'paused' | 'heating' | 'homing' | 'probing' | 'updating'

/** The base's round screen: MuonUI's Home, as the printer's own panel shows it. */
export interface ScreenState {
  status: ScreenStatus;
  /** 0 to 100; shown while printing or paused. */
  progress: number;
  nozzleTemp: number;
  nozzleTarget: number;
  bedTemp: number;
  bedTarget: number;
  jobName: string;
  connected: boolean;
}

export interface Heater {
  temperature?: number;
  target?: number;
}

export interface ScreenFacts {
  /** Klipper's print_stats.state. */
  printState: string;
  /** An update of the printer is under way. */
  updating: boolean;
  /** Homing is under way. */
  homing: boolean;
  /** A bed measurement is under way. */
  probing: boolean;
  /** 0 to 1. */
  progress: number;
  nozzle: Heater | null;
  bed: Heater | null;
  /** print_stats.filename. */
  filename: string;
  connected: boolean;
}

/** A heater still on its way up to its target. */
const warming = (h: Heater | null) => !!h && (h.target ?? 0) > 0 && (h.temperature ?? 0) < (h.target ?? 0) - 2

/**
 * What the screen says the printer is doing. A print wins, since the
 * printer homes and measures inside one and its own panel stays on Print;
 * then an update, a measurement, homing, and a heater warming.
 */
export function screenFrom (f: ScreenFacts): ScreenState {
  let status: ScreenStatus = 'idle'
  if (f.printState === 'printing') status = 'printing'
  else if (f.printState === 'paused') status = 'paused'
  else if (f.updating) status = 'updating'
  else if (f.probing) status = 'probing'
  else if (f.homing) status = 'homing'
  else if (warming(f.nozzle) || warming(f.bed)) status = 'heating'
  const name = f.filename.split('/').pop() ?? ''
  return {
    status,
    progress: Math.max(0, Math.min(100, Math.round(f.progress * 100))),
    nozzleTemp: f.nozzle?.temperature ?? 0,
    nozzleTarget: f.nozzle?.target ?? 0,
    bedTemp: f.bed?.temperature ?? 0,
    bedTarget: f.bed?.target ?? 0,
    jobName: name,
    connected: f.connected
  }
}

/** One place the plate was touched. */
export interface PlateTap {
  x: number;
  y: number;
  /** The height found there, mm. */
  z: number;
  /** A touch homing Z (a PROBE), not a point of the mesh. */
  homing: boolean;
}

/** A mark's key: where it is and what it is, so a new one can be told from one seen. */
export const tapKey = (t: PlateTap) => `${t.homing ? 'h' : 'm'}:${t.x.toFixed(1)},${t.y.toFixed(1)}`

/**
 * The touches as the M1 shows them: one mark per mesh point (its touches
 * averaged, as Klipper does), and one per place Z was homed (the M1's two
 * PROBEs there are one mark, showing the last), in the order they came, so
 * the newest is last.
 */
export function plateTaps (touches: ProbeTouch[]): PlateTap[] {
  type Mark = PlateTap & { time: number, order: number }
  const marks: Mark[] = meshPoints(touches)
    .map((p, order) => ({ x: p.x, y: p.y, z: p.z, homing: false, time: p.time, order }))
  touches.forEach((t, i) => {
    if (t.kind === 'result') marks.push({ x: t.x, y: t.y, z: t.z, homing: true, time: t.time, order: i })
  })
  marks.sort((a, b) => a.time - b.time || a.order - b.order)
  const byPlace = new Map<string, Mark>()
  for (const m of marks) {
    byPlace.delete(tapKey(m))
    byPlace.set(tapKey(m), m)
  }
  return [...byPlace.values()].map(({ x, y, z, homing }) => ({ x, y, z, homing }))
}

/** Past this far from the middle of the mesh's heights a mark is fully blue (low) or red (high). */
export const TAP_SPAN_MM = 0.2

const LOW = [0x4a, 0x8f, 0xe0]
const LEVEL = [0x5c, 0xc9, 0x8f]
const HIGH = [0xf0, 0x6b, 0x61]
/** The accent: homing's touches are not heights of the mesh. */
export const HOMING_COLOUR = 0x80d6d1

/** The middle of the mesh marks' heights, which reads as level. */
export function middleHeight (taps: PlateTap[]): number {
  const zs = taps.filter(t => !t.homing).map(t => t.z).sort((a, b) => a - b)
  if (!zs.length) return 0
  const mid = zs.length >> 1
  return zs.length % 2 ? zs[mid] : (zs[mid - 1] + zs[mid]) / 2
}

/** A mark's colour: green where level with the middle, toward blue lower and red higher. */
export function tapColour (tap: PlateTap, middle: number): number {
  if (tap.homing) return HOMING_COLOUR
  const t = Math.max(-1, Math.min(1, (tap.z - middle) / TAP_SPAN_MM))
  const to = t < 0 ? LOW : HIGH
  const k = Math.abs(t)
  const c = LEVEL.map((v, i) => Math.round(v + (to[i] - v) * k))
  return (c[0] << 16) | (c[1] << 8) | c[2]
}

/** Klipper's color_data for one strip: a [r, g, b, w] per pixel, each 0 to 1. */
export type LedStrip = number[][] | null

/** Whether any pixel of the strips is lit. */
export function stripsLit (left: LedStrip, right: LedStrip): boolean {
  return [left, right].some(strip => !!strip && strip.some(px => px.some(v => v > 0.004)))
}
