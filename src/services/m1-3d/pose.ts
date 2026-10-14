/** What the live M1 shows of the printer. */
export interface PrinterPose {
  /** Klipper's toolhead position, mm: X, Y, Z. */
  position: number[];
  /** Klipper's homed_axes, "xyz" when all are. */
  homed: string;
  lights: boolean;
  /** 0 to 100, for the base's screen. */
  progress: number;
}

/** The pose in the printer's millimetres; an axis that isn't homed is null, since Klipper reports 0 for it. */
export interface ModelPose {
  x: number | null;
  y: number | null;
  z: number | null;
  led: boolean;
  progress: number;
}

/** Where the model's parts are, measured from its geometry once it's built (viewer.ts). */
export interface Calibration {
  /** The plate's left and front edges, and its underside with the bed at the bottom of its travel (state z 0). */
  plateLeft: number;
  plateFront: number;
  plateUnderside: number;
  /** The nozzle tip with the head at the middle of both rails (head 0, 0). */
  nozzleX: number;
  nozzleZ: number;
  tipTop: number;
  /** How far the head goes for a head of 1 along each rail, and the bed for a z of 1. */
  travelX: number;
  travelZ: number;
  bedTravel: number;
}

/** The model's state for the head and the bed. */
export interface ModelPlacement {
  headX: number;
  headZ: number;
  z: number;
}

/** Where an axis that isn't homed is drawn: the model's own resting pose. */
export const RESTING: ModelPlacement = { headX: 0.34, headZ: 0.55, z: 0.42 }

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export function modelPose (p: PrinterPose): ModelPose {
  const homed = p.homed.toLowerCase()
  const axis = (i: number, name: string) => homed.includes(name) && Number.isFinite(p.position[i]) ? p.position[i] : null
  return {
    x: axis(0, 'x'),
    y: axis(1, 'y'),
    z: axis(2, 'z'),
    led: p.lights,
    progress: clamp(Math.round(p.progress), 0, 100)
  }
}

/**
 * Puts the nozzle tip over the plate point the printer means and the plate
 * that far above it. The printer's X runs left to right from the plate's
 * left edge as you face it, Y from its front edge to the back (Klipper's
 * usual sense, so the model's +Z, the front, is Y 0), and Z is the gap
 * from the tip to the plate. So a print drawn on the plate in the same
 * millimetres meets the nozzle where the printer is.
 */
export function placeModel (pose: ModelPose, c: Calibration): ModelPlacement {
  return {
    headX: pose.x === null ? RESTING.headX : clamp((c.plateLeft + pose.x - c.nozzleX) / c.travelX, -1.05, 1.05),
    headZ: pose.y === null ? RESTING.headZ : clamp((c.plateFront - pose.y - c.nozzleZ) / c.travelZ, -1.05, 1.05),
    z: pose.z === null ? RESTING.z : clamp((c.tipTop + pose.z - c.plateUnderside) / c.bedTravel, -0.2, 1.05)
  }
}

/** Whether two poses look the same at the stage's size: within a twentieth of a millimetre. */
export function samePose (a: ModelPose | null, b: ModelPose): boolean {
  if (!a) return false
  const near = (u: number | null, v: number | null) => u === v || (u !== null && v !== null && Math.abs(u - v) < 0.05)
  return near(a.x, b.x) && near(a.y, b.y) && near(a.z, b.z) && a.led === b.led && a.progress === b.progress
}
