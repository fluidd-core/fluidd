import { describe, expect, it } from 'vitest'
import type { Move } from '@/store/gcodePreview/types'
import { motionPathFrom, type MotionReport } from '../motion'
import { LiveSync, MAX_TRACE, PlateTrace } from '../live-sync'
import { HOMING_COLOUR, middleHeight, plateTaps, screenFrom, stripsLit, tapColour, type ScreenFacts } from '../live-state'
import { parseProbeLine, type ProbeTouch } from '@/services/maintenance/live-probe'

const homed = { x: 0, y: 0, z: 0, led: false, progress: 0 }
const report = (at: number, live: [number, number, number], more: Partial<MotionReport> = {}): MotionReport => ({
  at, live, velocity: 0, extruderVelocity: 0, target: live, speedFactor: 1, filePosition: null, ...more
})

describe('the head between reports', () => {
  it('eases into a correction rather than jumping', () => {
    const sync = new LiveSync()
    sync.setPose(homed)
    sync.observe(report(0, [10, 10, 1]))
    expect(sync.frame(10).pose.x).toBeCloseTo(10)
    // The printer says the head is 2 mm further on than drawn: drawn at first where it was, then there.
    sync.observe(report(20, [12, 10, 1]))
    const first = sync.frame(20)
    expect(first.pose.x).toBeCloseTo(10)
    expect(first.moving).toBe(true)
    expect(sync.frame(600).pose.x).toBeCloseTo(12, 2)
  })

  it('jumps when the report is far from what was drawn', () => {
    const sync = new LiveSync()
    sync.setPose(homed)
    sync.observe(report(0, [10, 10, 1]))
    sync.frame(5)
    sync.observe(report(10, [150, 10, 1]))
    expect(sync.frame(10).pose.x).toBeCloseTo(150)
  })

  it('leaves an axis that isn\'t homed where the model rests it', () => {
    const sync = new LiveSync()
    sync.setPose({ ...homed, z: null })
    sync.observe(report(0, [10, 20, 30]))
    expect(sync.frame(0).pose).toMatchObject({ x: 10, y: 20, z: null })
  })

  it('goes by the printer\'s own position once the reports have stopped and disagree with it', () => {
    const sync = new LiveSync()
    sync.setPose({ ...homed, x: 10, y: 10, z: 1 })
    sync.observe(report(0, [10, 10, 1]))
    sync.setPose({ ...homed, x: 80, y: 10, z: 1 })
    expect(sync.frame(1000).pose.x).toBeCloseTo(10)
    expect(sync.frame(5000).pose.x).toBe(80)
  })
})

describe('the print on the plate', () => {
  // Two 100 mm extrusions along X, then along Y.
  const moves: Move[] = [
    { x: 0, y: 0, z: 0.2, f: 6000, filePosition: 0 },
    { x: 100, y: 0, e: 4, f: 3000, filePosition: 10 },
    { x: 100, y: 100, e: 4, filePosition: 20 }
  ]

  it('is drawn to the nozzle, with the line being laid in part', () => {
    const sync = new LiveSync()
    sync.setPose(homed)
    sync.setPath(motionPathFrom(moves))
    sync.setFileDone(2)
    sync.observe(report(0, [100, 40, 0.2], { velocity: 50, extruderVelocity: 2, filePosition: 20 }))
    const f = sync.frame(0)
    expect(f.printDone).toBe(1)
    expect(f.nib?.[0]).toEqual([100, 0, Math.fround(0.2)])
    expect(f.nib?.[1][1]).toBeCloseTo(40)
  })

  it('never takes back what is drawn when the head passes near an earlier line', () => {
    const sync = new LiveSync()
    sync.setPose(homed)
    sync.setPath(motionPathFrom(moves))
    sync.observe(report(0, [100, 40, 0.2], { velocity: 50, filePosition: 20 }))
    sync.frame(0)
    sync.observe(report(250, [60, 0, 0.2], { velocity: 50, filePosition: 20 }))
    expect(sync.frame(250).printDone).toBe(1)
  })

  it('goes by the file\'s read position until the head is found on it', () => {
    const sync = new LiveSync()
    sync.setPose(homed)
    sync.setPath(motionPathFrom(moves))
    sync.setFileDone(2)
    expect(sync.frame(0).printDone).toBe(2)
  })
})

describe('filament no file drew', () => {
  it('is laid where the head extrudes off the file, a line per run', () => {
    const sync = new LiveSync()
    sync.setPose(homed)
    sync.observe(report(0, [5, 170, 0.3], { velocity: 20, extruderVelocity: 1 }))
    sync.observe(report(250, [10, 170, 0.3], { velocity: 20, extruderVelocity: 1 }))
    sync.observe(report(500, [15, 170, 0.3], { velocity: 20, extruderVelocity: 1 }))
    sync.observe(report(750, [40, 170, 5], { velocity: 100 }))
    sync.observe(report(1000, [45, 170, 0.3], { velocity: 20, extruderVelocity: 1 }))
    expect(sync.trace.count).toBe(2)
    expect(Array.from(sync.trace.positions.slice(0, 6))).toEqual([5, 170, 0.3, 10, 170, 0.3].map(Math.fround))
    expect(sync.trace.tip).toEqual([45, 170, 0.3])
  })

  it('isn\'t laid before the printer is homed', () => {
    const sync = new LiveSync()
    sync.setPose({ ...homed, x: null })
    sync.observe(report(0, [5, 170, 0.3], { extruderVelocity: 1 }))
    sync.observe(report(250, [10, 170, 0.3], { extruderVelocity: 1 }))
    expect(sync.trace.count).toBe(0)
  })

  it('drops its oldest half when full', () => {
    const trace = new PlateTrace()
    for (let i = 0; i <= MAX_TRACE + 1; i++) trace.add([i, 0, 0])
    expect(trace.count).toBe((MAX_TRACE >> 1) + 1)
    expect(trace.version).toBe(1)
    expect(trace.positions[trace.count * 6 - 3]).toBe(MAX_TRACE + 1)
  })
})

describe('the base\'s screen', () => {
  const facts: ScreenFacts = {
    printState: 'standby',
    updating: false,
    homing: false,
    probing: false,
    progress: 0.425,
    nozzle: { temperature: 24, target: 0 },
    bed: { temperature: 23, target: 0 },
    filename: 'parts/bracket.gcode',
    connected: true
  }

  it('says what the printer is doing, a print first', () => {
    expect(screenFrom(facts).status).toBe('idle')
    expect(screenFrom({ ...facts, nozzle: { temperature: 100, target: 215 } }).status).toBe('heating')
    expect(screenFrom({ ...facts, homing: true, nozzle: { temperature: 100, target: 215 } }).status).toBe('homing')
    expect(screenFrom({ ...facts, probing: true, homing: true }).status).toBe('probing')
    expect(screenFrom({ ...facts, updating: true }).status).toBe('updating')
    expect(screenFrom({ ...facts, printState: 'printing', probing: true }).status).toBe('printing')
    expect(screenFrom({ ...facts, printState: 'paused' }).status).toBe('paused')
  })

  it('carries the job, its progress and the temperatures', () => {
    expect(screenFrom({ ...facts, printState: 'printing' })).toMatchObject({
      progress: 43, jobName: 'bracket.gcode', nozzleTemp: 24, bedTarget: 0, connected: true
    })
  })
})

describe('touches of the plate', () => {
  const lines = [
    'probe: at 100.000,90.000 bed will contact at z=0.012000',
    'Result: at 100.000,90.000 estimate contact at z=0.012000',
    'probe: at 100.000,90.000 bed will contact at z=0.010000',
    'Result: at 100.000,90.000 estimate contact at z=0.010000',
    'probe: at 10.000,7.000 bed will contact at z=0.100000',
    'probe: at 10.000,7.000 bed will contact at z=0.120000',
    'probe: at 70.000,7.000 bed will contact at z=-0.050000'
  ]
  const touches = lines.map((l, i) => parseProbeLine(l, 1000 + i)).filter((t): t is ProbeTouch => !!t)

  it('marks each mesh point once and each place Z was homed once, newest last', () => {
    expect(plateTaps(touches)).toEqual([
      { x: 100, y: 90, z: 0.01, homing: true },
      { x: 10, y: 7, z: expect.closeTo(0.11), homing: false },
      { x: 70, y: 7, z: -0.05, homing: false }
    ])
  })

  it('colours a mark by its height against the middle of the mesh', () => {
    const taps = plateTaps(touches)
    const middle = middleHeight(taps)
    expect(middle).toBeCloseTo(0.03)
    expect(tapColour({ x: 0, y: 0, z: middle, homing: false }, middle)).toBe(0x5cc98f)
    expect(tapColour({ x: 0, y: 0, z: middle + 1, homing: false }, middle)).toBe(0xf06b61)
    expect(tapColour({ x: 0, y: 0, z: middle - 1, homing: false }, middle)).toBe(0x4a8fe0)
    expect(tapColour(taps[0], middle)).toBe(HOMING_COLOUR)
  })
})

it('knows the strips are dark when every pixel is off', () => {
  expect(stripsLit([[0, 0, 0, 0]], null)).toBe(false)
  expect(stripsLit([[0, 0, 0, 0]], [[0, 0.5, 0, 0]])).toBe(true)
  expect(stripsLit(null, null)).toBe(false)
})
