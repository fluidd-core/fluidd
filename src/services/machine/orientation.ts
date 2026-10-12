/**
 * Which way the printer's axes run as you stand in front of it. Everything
 * that draws the plate reads this, so they all agree: the move pad, the bed
 * mesh views, and the live M1 with the print under its plate.
 *
 * X runs left to right. Y runs from the back toward you: the M1 prints
 * hanging under its plate, and for a part to come out the way it was sliced
 * (not mirrored) with Z building downward, its Y has to grow toward the
 * front. Klipper's +Y moves the head forward (Jack, on Boxwood, 2026-10-11).
 */
export const Y_TOWARD_FRONT = true

/** How far down a plate drawn with its back at the top a Y sits: 0 is the back edge, 1 the front. */
export function rowFraction (y: number, min: number, max: number): number {
  const f = (y - min) / Math.max(1e-9, max - min)
  return Y_TOWARD_FRONT ? f : 1 - f
}

/** The Y at a fraction down a plate drawn with its back at the top. */
export function yAtRow (fraction: number, min: number, max: number): number {
  const f = Y_TOWARD_FRONT ? fraction : 1 - fraction
  return min + f * (max - min)
}

/** The sign of a Y step that moves the head toward the back of the machine. */
export const Y_BACK = Y_TOWARD_FRONT ? -1 : 1

/** Rows of a grid ordered by Y ascending (Klipper's probed_matrix), back row first. */
export function backRowFirst<T> (rows: T[]): T[] {
  return Y_TOWARD_FRONT ? [...rows] : [...rows].reverse()
}
