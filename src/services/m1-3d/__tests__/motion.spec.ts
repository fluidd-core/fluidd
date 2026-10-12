import { describe, expect, it } from 'vitest'
import type { Move } from '@/store/gcodePreview/types'
import { toolpathFrom } from '../toolpath'
import { MotionPredictor, advance, drawnAt, lastRead, locate, motionPathFrom, pointAt } from '../motion'

// A travel to (10,10), then a 100 mm square at 50 mm/s on layer 0.2, then the same square on layer 0.4.
const square = (z: number, start: number): Move[] => [
  { x: 110, y: 10, z, e: 4, f: 3000, filePosition: start },
  { x: 110, y: 110, e: 4, filePosition: start + 20 },
  { x: 10, y: 110, e: 4, filePosition: start + 40 },
  { x: 10, y: 10, e: 4, filePosition: start + 60 }
]
const MOVES: Move[] = [{ x: 10, y: 10, z: 0.2, f: 6000, filePosition: 0 }, ...square(0.2, 10), ...square(0.4, 100)]

describe('the print as a path', () => {
  const path = motionPathFrom(MOVES)

  it('times each move at its feed rate', () => {
    expect(path.t[0]).toBeCloseTo(Math.hypot(10, 10, 0.2) / 100, 3)
    expect(path.t[1] - path.t[0]).toBeCloseTo(2, 5) // 100 mm at 50 mm/s
  })

  it('counts drawn segments exactly as the toolpath does', () => {
    expect(path.drawn[path.count - 1]).toBe(toolpathFrom(MOVES).count)
    expect(path.extrudes[0]).toBe(0)
    expect(path.extrudes[1]).toBe(1)
  })

  it('knows the last move the printer has read', () => {
    expect(lastRead(path, 55)).toBe(3)
    expect(lastRead(path, 1000)).toBe(8)
  })

  it('finds the head on the right layer when two pass over the same point', () => {
    const found = locate(path, [110, 60, 0.4], 1000)
    expect(found?.at.i).toBe(6)
    expect(found?.at.f).toBeCloseTo(0.5)
    expect(locate(path, [110, 60, 0.2], 50)?.at.i).toBe(2)
  })

  it('moves on along the path, never past what was read', () => {
    const half = advance(path, { i: 1, f: 0 }, 1, 8)
    const [hx, hy, hz] = pointAt(path, half)
    expect([hx, hy]).toEqual([60, 10])
    expect(hz).toBeCloseTo(0.2)
    expect(advance(path, { i: 1, f: 0 }, 100, 3)).toEqual({ i: 3, f: 1 })
  })

  it('draws the part to the nozzle, the segment being laid in part', () => {
    expect(drawnAt(path, { i: 2, f: 0.25 })).toEqual({ segments: 1, partial: 0.25 })
    expect(drawnAt(path, { i: 0, f: 0.5 })).toEqual({ segments: 0, partial: 0 })
  })
})

describe('the head between reports', () => {
  it('follows the file while printing, at the speed factor', () => {
    const p = new MotionPredictor()
    p.setPath(motionPathFrom(MOVES))
    p.observe({ at: 1000, live: [110, 40, 0.2], velocity: 50, extruderVelocity: 2, target: [10, 110, 0.2], speedFactor: 1.5, filePosition: 60 })
    const later = p.at(1200)
    // 0.2 s at 150% of 50 mm/s is 15 mm on along the move up the right side.
    expect(later?.position[0]).toBeCloseTo(110)
    expect(later?.position[1]).toBeCloseTo(55)
    expect(later?.extruding).toBe(true)
  })

  it('goes from the live position toward the end of the queue at its live speed, off the file', () => {
    const p = new MotionPredictor()
    p.observe({ at: 0, live: [0, 0, 5], velocity: 100, extruderVelocity: 0, target: [100, 0, 5], speedFactor: 1, filePosition: null })
    expect(p.at(250)?.position).toEqual([25, 0, 5])
    expect(p.at(5000)?.position[0]).toBeCloseTo(35) // no further than just past the next report's due time
    expect(p.at(5000)?.moving).toBe(false)
  })

  it('carries on the way the head was going, not toward a queue end round a corner', () => {
    const p = new MotionPredictor()
    const report = { velocity: 40, extruderVelocity: 0, speedFactor: 1, filePosition: null }
    p.observe({ ...report, at: 0, live: [0, 0, 1], target: [10, 50, 1] })
    p.observe({ ...report, at: 250, live: [10, 0, 1], target: [10, 50, 1] })
    expect(p.at(350)?.position).toEqual([14, 0, 1])
  })

  it('stops at the end of the queue when it lies straight ahead', () => {
    const p = new MotionPredictor()
    const report = { velocity: 40, extruderVelocity: 0, speedFactor: 1, filePosition: null }
    p.observe({ ...report, at: 0, live: [0, 0, 1], target: [12, 0, 1] })
    p.observe({ ...report, at: 250, live: [10, 0, 1], target: [12, 0, 1] })
    expect(p.at(450)?.position).toEqual([12, 0, 1])
    expect(p.at(450)?.moving).toBe(false)
  })

  it('stays put once the printer says the head has stopped', () => {
    const p = new MotionPredictor()
    p.observe({ at: 0, live: [5, 6, 7], velocity: 0, extruderVelocity: 0, target: [50, 6, 7], speedFactor: 1, filePosition: null })
    expect(p.at(200)).toMatchObject({ position: [5, 6, 7], moving: false })
  })

  it('treats a purge off the file\'s path as the printer\'s own move', () => {
    const p = new MotionPredictor()
    p.setPath(motionPathFrom(MOVES))
    p.observe({ at: 0, live: [180, 5, 0.3], velocity: 20, extruderVelocity: 1.5, target: [190, 5, 0.3], speedFactor: 1, filePosition: 5 })
    const now = p.at(100)
    expect(now?.place).toBeNull()
    expect(now?.extruding).toBe(true)
    expect(now?.position[0]).toBeCloseTo(182)
  })
})
