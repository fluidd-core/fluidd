import { describe, expect, it } from 'vitest'
import { partColour, segmentsDone, toolpathFrom } from '../toolpath'
import type { Move } from '@/store/gcodePreview/types'

const moves: Move[] = [
  { z: 0.2, filePosition: 10 },
  { x: 10, y: 10, filePosition: 20 },
  { x: 20, y: 10, e: 0.5, filePosition: 30 },
  { x: 20, y: 20, e: 0.5, filePosition: 40 },
  { e: -0.8, filePosition: 50 },
  { x: 40, y: 40, filePosition: 60 },
  { z: 0.4, filePosition: 70 },
  { e: 0.8, filePosition: 80 },
  { x: 50, e: 0.4, filePosition: 90 }
]

describe('a print as segments', () => {
  const path = toolpathFrom(moves)

  it('keeps only the moves that extrude somewhere, from where the head was', () => {
    expect(path.count).toBe(3)
    expect(Array.from(path.positions.subarray(0, 6))).toEqual([10, 10, 0.2, 20, 10, 0.2].map(Math.fround))
    expect(Array.from(path.positions.subarray(12, 18))).toEqual([40, 40, 0.4, 50, 40, 0.4].map(Math.fround))
    expect(Array.from(path.ends)).toEqual([30, 40, 90])
  })

  it('leaves out a travel, a retraction and an unretraction in place', () => {
    expect(Array.from(path.ends)).not.toContain(60)
    expect(Array.from(path.ends)).not.toContain(80)
  })

  it('stops at the most a device can hold', () => {
    expect(toolpathFrom(moves, 2).count).toBe(2)
  })

  it('draws as far as the printer has read', () => {
    expect(segmentsDone(path, 0)).toBe(0)
    expect(segmentsDone(path, 39)).toBe(1)
    expect(segmentsDone(path, 40)).toBe(2)
    expect(segmentsDone(path, 1e9)).toBe(3)
  })
})

describe("the part's colour", () => {
  it("is the slicer's filament colour, the first of several", () => {
    expect(partColour('#1F7A73')).toBe(0x1f7a73)
    expect(partColour('#FF0000;#00FF00')).toBe(0xff0000)
    expect(partColour(['#00FF00', '#FF0000'])).toBe(0x00ff00)
  })

  it("is the model's PLA magenta when the slicer didn't say", () => {
    expect(partColour(undefined)).toBe(0xc00a66)
    expect(partColour('red')).toBe(0xc00a66)
  })
})
