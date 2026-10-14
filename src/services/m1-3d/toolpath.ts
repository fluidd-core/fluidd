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

/**
 * The extrusions of a G-code file read straight from its bytes, without
 * Fluidd's preview: for a file too big to load into the preview (over
 * 16 MB), or where the preview is busy. Each segment's end is the byte
 * offset its line starts at, as the preview's `filePosition` is, so
 * `segmentsDone` treats both alike. Arcs are drawn as their chords.
 *
 * Opening a print part-way through used to show only what was laid down
 * after the page opened (the trace), never what was already printed
 * (14 Oct 2026): the part needs the file from its first byte.
 */
export function toolpathFromGcode (bytes: Uint8Array, max = MAX_SEGMENTS): Toolpath {
  // One character per byte, so a string index is the file's byte offset.
  const text = new TextDecoder('latin1').decode(bytes)
  let positions = new Float32Array(Math.min(max, 65536) * 6)
  let ends = new Float64Array(Math.min(max, 65536))
  let count = 0
  let x = 0
  let y = 0
  let z = 0
  let e = 0
  // As Klipper's gcode_move keeps them: G90/G91 set the coordinates, M82/M83
  // the extruder, and E is absolute only while both are.
  let absolute = true
  let absoluteExtrude = true
  let start = 0
  const n = text.length
  while (start < n && count < max) {
    let end = text.indexOf('\n', start)
    if (end === -1) end = n
    const lineStart = start
    start = end + 1
    let line = text.slice(lineStart, end)
    const comment = line.indexOf(';')
    if (comment >= 0) line = line.slice(0, comment)
    line = line.trim()
    const c0 = line.charCodeAt(0)
    // G or g, M or m
    if (c0 !== 71 && c0 !== 103 && c0 !== 77 && c0 !== 109) continue
    const words = line.split(/\s+/)
    const command = words[0].toUpperCase()
    if (command === 'G90') { absolute = true; continue }
    if (command === 'G91') { absolute = false; continue }
    if (command === 'M82') { absoluteExtrude = true; continue }
    if (command === 'M83') { absoluteExtrude = false; continue }
    if (command === 'G92') {
      for (const w of words) if (w[0] === 'E' || w[0] === 'e') e = parseFloat(w.slice(1)) || 0
      continue
    }
    if (!/^G0?[0-3]$/.test(command)) continue
    let nx = x
    let ny = y
    let nz = z
    let extruded = 0
    let movesXY = false
    for (let i = 1; i < words.length; i++) {
      const w = words[i]
      const v = parseFloat(w.slice(1))
      if (Number.isNaN(v)) continue
      switch (w[0]) {
        case 'X': case 'x': nx = absolute ? v : x + v; movesXY = true; break
        case 'Y': case 'y': ny = absolute ? v : y + v; movesXY = true; break
        case 'Z': case 'z': nz = absolute ? v : z + v; break
        case 'E': case 'e': {
          const ne = absolute && absoluteExtrude ? v : e + v
          extruded = ne - e
          e = ne
          break
        }
      }
    }
    if (extruded > 0 && movesXY && (nx !== x || ny !== y)) {
      if (count === ends.length) {
        const grown = Math.min(max, ends.length * 2)
        const p = new Float32Array(grown * 6)
        p.set(positions)
        positions = p
        const f = new Float64Array(grown)
        f.set(ends)
        ends = f
      }
      positions.set([x, y, nz, nx, ny, nz], count * 6)
      ends[count] = lineStart
      count++
    }
    x = nx
    y = ny
    z = nz
  }
  return { positions: positions.subarray(0, count * 6), ends: ends.subarray(0, count), count }
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
