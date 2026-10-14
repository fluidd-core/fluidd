import { describe, expect, it } from 'vitest'
import type { Move } from '@/store/gcodePreview/types'
import { fastPercent, fileMaxFlow, leftAt, materialMaxFlow, peakFlow, speedChoices } from '../speed'

/** Lines of a 0.45 x 0.2 mm bead: e per mm of travel is 0.45 * 0.2 / 2.405 (1.75 mm filament). */
const bead = (fromX: number, toX: number, mmPerS: number, filePosition: number): Move =>
  ({ x: toX, y: 0, z: 0.2, e: (toX - fromX) * 0.45 * 0.2 / 2.405, f: mmPerS * 60, filePosition })

describe('the print\'s flow', () => {
  it('is the flow its busiest extruding time runs at, as sliced', () => {
    // Mostly 100 mm/s (9 mm³/s), a little at 300 mm/s (27 mm³/s, under 5% of the time).
    const moves: Move[] = [{ x: 0, y: 0, z: 0.2, filePosition: 0 }]
    let x = 0
    for (let i = 0; i < 40; i++) { moves.push(bead(x, x + 100, 100, i)); x += 100 }
    moves.push(bead(x, x + 30, 300, 99))
    expect(peakFlow(moves)).toBeCloseTo(9, 1)
  })

  it('is unknown without feed rates', () => {
    expect(peakFlow([{ x: 10, e: 1, filePosition: 0 }])).toBeNull()
  })

  it('reads the slicer\'s melt limit from the file, else the material\'s', () => {
    expect(fileMaxFlow('G1 X1\n; filament_max_volumetric_speed = 12\n')).toBe(12)
    expect(fileMaxFlow('; nothing here')).toBeNull()
    expect(materialMaxFlow('petg')).toBe(10)
    expect(materialMaxFlow('PLA;PLA')).toBe(15)
    expect(materialMaxFlow('wood')).toBeNull()
  })
})

describe('Fast', () => {
  it('goes as fast as the nozzle can melt it, up to 150%', () => {
    expect(fastPercent(9, 12)).toBe(130)
    expect(fastPercent(5, 15)).toBe(150)
  })

  it('is left out for a print already at the limit', () => {
    expect(fastPercent(11.5, 12)).toBeNull()
    expect(speedChoices(null, true).map(c => c.label)).toEqual(['Slow', 'Normal'])
  })

  it('is a quarter faster when the print\'s flow isn\'t known', () => {
    expect(fastPercent(null, 15)).toBe(125)
    expect(speedChoices(125, false)[2].note).toMatch(/quarter faster/)
  })

  it('says how long is left at another speed, only the moving scaling', () => {
    expect(leftAt(3600, 100, 50)).toBe(900 + 5400)
    expect(leftAt(3600, 100, 100)).toBe(3600)
  })
})
