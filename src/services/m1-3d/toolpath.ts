import type { Move } from '@/store/gcodePreview/types'

/**
 * A print's extrusions as line segments, in the printer's own millimetres:
 * six numbers a segment (from x, y, z, to x, y, z), and for each the file
 * position it ends at, so the part can be drawn as far as the printer has
 * read.
 */
export interface Toolpath {
  positions: Float32Array;
  ends: Float64Array;
  count: number;
}

/** Past this many segments the rest of a file is left out; a phone can't hold more. */
export const MAX_SEGMENTS = 1_500_000

/**
 * The extruding moves of a parsed file (Fluidd's G-code preview, whose x, y
 * and z are absolute and e is the length extruded). A move extrudes when e
 * is positive and the head goes somewhere; an arc is drawn as its chord.
 */
export function toolpathFrom (moves: readonly Move[], max = MAX_SEGMENTS): Toolpath {
  let count = 0
  for (const m of moves) if (m.e !== undefined && m.e > 0 && (m.x !== undefined || m.y !== undefined)) count++
  count = Math.min(count, max)
  const positions = new Float32Array(count * 6)
  const ends = new Float64Array(count)
  let x = 0
  let y = 0
  let z = 0
  let n = 0
  for (const m of moves) {
    const nx = m.x ?? x
    const ny = m.y ?? y
    const nz = m.z ?? z
    if (n < count && m.e !== undefined && m.e > 0 && (m.x !== undefined || m.y !== undefined) && (nx !== x || ny !== y)) {
      positions.set([x, y, nz, nx, ny, nz], n * 6)
      ends[n] = m.filePosition
      n++
    }
    x = nx
    y = ny
    z = nz
  }
  return { positions: positions.subarray(0, n * 6), ends: ends.subarray(0, n), count: n }
}

/** How many segments the printer has finished by `filePosition`: those ending at or before it. */
export function segmentsDone (path: Toolpath, filePosition: number): number {
  let lo = 0
  let hi = path.count
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (path.ends[mid] <= filePosition) lo = mid + 1
    else hi = mid
  }
  return lo
}

/**
 * The part's colour from the slicer's "#RRGGBB": Moonraker's filament_colors
 * list, or one string of several, taking the first. Else the model's
 * magenta PLA.
 */
export function partColour (filamentColours: unknown): number {
  const value = Array.isArray(filamentColours) ? filamentColours[0] : filamentColours
  const first = typeof value === 'string' ? value.split(/[;,]/)[0].trim() : ''
  return /^#[0-9a-f]{6}$/i.test(first) ? parseInt(first.slice(1), 16) : 0xc00a66
}
