/** What the live M1 shows of the printer. */
export interface PrinterPose {
  /** Klipper's toolhead position, mm: X, Y, Z. */
  position: number[];
  axisMin: number[];
  axisMax: number[];
  /** Klipper's homed_axes, "xyz" when all are. */
  homed: string;
  lights: boolean;
  /** 0 to 100, for the base's screen. */
  progress: number;
}

/** Where the model puts the head and the bed. */
export interface ModelPose {
  headX: number;
  headZ: number;
  z: number;
  led: boolean;
  progress: number;
}

/**
 * Where an axis that isn't homed is drawn: the model's own resting pose,
 * since Klipper reports 0 for an axis it hasn't found.
 */
export const RESTING: Pick<ModelPose, 'headX' | 'headZ' | 'z'> = { headX: 0.34, headZ: 0.55, z: 0.42 }

/** The M1's travel when Klipper hasn't said (core.cfg): X 0..200.1, Y -10..174.1, Z -4..160. */
const M1_MIN = [0, -10, -4]
const M1_MAX = [200.1, 174.1, 160]

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** Where `value` sits between an axis's ends, 0 to 1. */
function along (value: number, axis: number, p: PrinterPose): number {
  const min = Number.isFinite(p.axisMin[axis]) ? p.axisMin[axis] : M1_MIN[axis]
  const max = Number.isFinite(p.axisMax[axis]) ? p.axisMax[axis] : M1_MAX[axis]
  if (!(max > min)) return 0.5
  return clamp((value - min) / (max - min), 0, 1)
}

/**
 * The model's pose for the printer's. X runs along the cross rail, left to
 * right as you face the printer. Y runs down the trough; the model's +Z is
 * the front, and Klipper's +Y is taken to be the back, its usual sense, so
 * Y is reversed. Z lifts the bed over its whole travel.
 */
export function modelPose (p: PrinterPose): ModelPose {
  const homed = p.homed.toLowerCase()
  const [x, y, z] = p.position
  return {
    headX: homed.includes('x') && Number.isFinite(x) ? along(x, 0, p) * 2 - 1 : RESTING.headX,
    headZ: homed.includes('y') && Number.isFinite(y) ? 1 - along(y, 1, p) * 2 : RESTING.headZ,
    z: homed.includes('z') && Number.isFinite(z) ? along(z, 2, p) : RESTING.z,
    led: p.lights,
    progress: clamp(Math.round(p.progress), 0, 100)
  }
}

/** Whether two poses look the same at the stage's size: under a tenth of a millimetre or so apart. */
export function samePose (a: ModelPose | null, b: ModelPose): boolean {
  if (!a) return false
  const near = (u: number, v: number) => Math.abs(u - v) < 5e-4
  return near(a.headX, b.headX) && near(a.headZ, b.headZ) && near(a.z, b.z) &&
    a.led === b.led && a.progress === b.progress
}
