import type { MoveStore } from '@/store/gcodePreview/types'
import { MoveFlags } from '@/store/gcodePreview/types'
import { binarySearch, buildLayerPaths } from '../gcode-preview'

const searchIn = (values: readonly number[], target: number): number => {
  return binarySearch(values.length, index => target - values[index])
}

const lastIndexAtOrBelow = (values: readonly number[], target: number): number => {
  let result = -1

  for (let index = 0; index < values.length; index++) {
    if (values[index] <= target) {
      result = index
    }
  }

  return result
}

describe('binarySearch', () => {
  it('returns -1 for an empty range', () => {
    expect(searchIn([], 0)).toBe(-1)
    expect(searchIn([], 100)).toBe(-1)
  })

  it.each([
    [4, -1],
    [5, 0],
    [6, 0],
  ])('handles a single entry with target %i', (target, expected) => {
    expect(searchIn([5], target)).toBe(expected)
  })

  it('returns -1 when the target sorts before the first entry', () => {
    expect(searchIn([5, 8, 11], 4)).toBe(-1)
  })

  it.each([
    [5, 0],
    [8, 1],
    [11, 2],
    [14, 3],
  ])('finds the exact match for %i', (target, expected) => {
    expect(searchIn([5, 8, 11, 14], target)).toBe(expected)
  })

  it.each([
    [6, 0],
    [7, 0],
    [9, 1],
    [13, 2],
  ])('floors %i to the preceding entry', (target, expected) => {
    expect(searchIn([5, 8, 11, 14], target)).toBe(expected)
  })

  it('returns the last index when the target is past the end', () => {
    expect(searchIn([5, 8, 11, 14], 15)).toBe(3)
    expect(searchIn([5, 8, 11, 14], 1000)).toBe(3)
  })

  it.each([
    [1],
    [2],
    [3],
    [4],
    [5],
    [16],
    [17],
    [64],
    [65],
  ])('matches the reference implementation for %i entries', (length) => {
    const values = Array.from({ length }, (_, index) => index * 3 + 5)

    for (let target = 0; target <= length * 3 + 8; target++) {
      expect(searchIn(values, target)).toBe(lastIndexAtOrBelow(values, target))
    }
  })
})

interface TestMove {
  x: number
  y: number
  i?: number
  j?: number
  tool?: number
  flags?: number
}

const createMoveStore = (moves: readonly TestMove[]): MoveStore => ({
  x: Float32Array.from(moves, move => move.x),
  y: Float32Array.from(moves, move => move.y),
  z: new Float32Array(moves.length),
  i: Float32Array.from(moves, move => move.i ?? 0),
  j: Float32Array.from(moves, move => move.j ?? 0),
  tool: Uint8Array.from(moves, move => move.tool ?? 0),
  flags: Uint8Array.from(moves, move => move.flags ?? 0),
  filePosition: Uint32Array.from(moves, (_, index) => index * 10),
  length: moves.length
})

describe('buildLayerPaths', () => {
  it('starts every path with a moveto', () => {
    const paths = buildLayerPaths(createMoveStore([
      { x: 0, y: 0 },
      { x: 10, y: 0, flags: MoveFlags.Extruding },
      { x: 10, y: 10, flags: MoveFlags.Extruding }
    ]), 0, 2, false)

    expect(paths.moves.startsWith('M')).toBe(true)

    for (const path of Object.values(paths.extrusions)) {
      expect(path.startsWith('M')).toBe(true)
    }
  })

  it('emits no undefined path data when the tool changes mid extrusion', () => {
    const paths = buildLayerPaths(createMoveStore([
      { x: 0, y: 0 },
      { x: 10, y: 0, tool: 0, flags: MoveFlags.Extruding },
      { x: 20, y: 0, tool: 1, flags: MoveFlags.Extruding },
      { x: 30, y: 0, tool: 0, flags: MoveFlags.Extruding }
    ]), 0, 3, false)

    expect(Object.keys(paths.extrusions)).toEqual(['T0', 'T1'])

    for (const path of Object.values(paths.extrusions)) {
      expect(path).not.toContain('undefined')
      expect(path.startsWith('M')).toBe(true)
    }
  })

  it('collapses extrusions under a single tool when ignoring tools', () => {
    const paths = buildLayerPaths(createMoveStore([
      { x: 0, y: 0 },
      { x: 10, y: 0, tool: 0, flags: MoveFlags.Extruding },
      { x: 20, y: 0, tool: 1, flags: MoveFlags.Extruding }
    ]), 0, 2, true)

    expect(Object.keys(paths.extrusions)).toEqual(['T0'])
  })

  it('emits an arc command for clockwise arc moves', () => {
    const paths = buildLayerPaths(createMoveStore([
      { x: 0, y: 0 },
      { x: 10, y: 10, i: 10, j: 0, flags: MoveFlags.Extruding | MoveFlags.Arc | MoveFlags.Clockwise }
    ]), 0, 1, true)

    expect(paths.extrusions.T0).toContain('A10,10,0,')
  })

  it('reverses counter clockwise arc moves', () => {
    const paths = buildLayerPaths(createMoveStore([
      { x: 0, y: 0 },
      { x: 10, y: 10, i: 10, j: 0, flags: MoveFlags.Extruding | MoveFlags.Arc }
    ]), 0, 1, true)

    // drawn backwards, then the toolhead is moved back to the real endpoint
    expect(paths.extrusions.T0).toMatch(/A[^M]+M10,10$/)
  })

  it('records retractions, unretractions and the final toolhead', () => {
    const paths = buildLayerPaths(createMoveStore([
      { x: 0, y: 0 },
      { x: 10, y: 0, flags: MoveFlags.Extruding },
      { x: 20, y: 0, flags: MoveFlags.Retracting },
      { x: 30, y: 0 },
      { x: 40, y: 0, flags: MoveFlags.Extruding }
    ]), 0, 4, true)

    expect(paths.retractions).toEqual([{ x: 10, y: 0 }])
    expect(paths.unretractions).toEqual([{ x: 0, y: 0 }, { x: 30, y: 0 }])
    expect(paths.toolhead).toEqual({ x: 40, y: 0 })
    expect(paths.tool).toBe('T0')
  })

  it('handles an empty move store', () => {
    const paths = buildLayerPaths(createMoveStore([]), 0, 10, false)

    expect(paths.moves).toBe('M0,0')
    expect(paths.extrusions).toEqual({})
    expect(paths.toolhead).toEqual({ x: 0, y: 0 })
  })

  it('clamps out of range move indexes', () => {
    const store = createMoveStore([{ x: 5, y: 5, flags: MoveFlags.Extruding }])

    expect(() => buildLayerPaths(store, -3, 99, false)).not.toThrow()
    expect(() => buildLayerPaths(store, 99, 200, false)).not.toThrow()
  })
})
