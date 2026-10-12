import { describe, expect, it } from 'vitest'
import {
  choosePlan,
  homingTouches,
  liveGrid,
  meshLayout,
  meshPoints,
  meshProgress,
  parseProbeLine,
  planFrom,
  planFromSettings,
  type ProbeTouch
} from '../live-probe'

const lines = (messages: string[]): ProbeTouch[] =>
  messages.map((m, i) => parseProbeLine(m, 1000 + i)).filter((t): t is ProbeTouch => t !== null)

// What an M1 prints for G28 then BED_MESH_CALIBRATE on a 2 x 2 mesh: Z homing
// is two PROBEs (one touch, then two), and the mesh touches each point twice.
const M1_RUN = [
  '// probe: at 100.000,90.000 bed will contact at z=10.410000',
  '// Result: at 100.000,90.000 estimate contact at z=10.410000',
  '// probe: at 100.000,90.000 bed will contact at z=0.021000',
  '// probe: at 100.000,90.000 bed will contact at z=0.019000',
  '// Result: at 100.000,90.000 estimate contact at z=0.020000',
  'BED_MESH_CALIBRATE',
  '// probe: at 10.000,7.000 bed will contact at z=0.051000',
  '// probe: at 10.000,7.000 bed will contact at z=0.049000',
  '// probe: at 190.000,7.000 bed will contact at z=-0.030000',
  '// probe: at 190.000,7.000 bed will contact at z=-0.032000',
  '// probe: at 190.000,170.000 bed will contact at z=0.110000',
  '// probe: at 190.000,170.000 bed will contact at z=0.112000'
]

describe('reading the probe lines', () => {
  it('reads the M1\'s wording, the older one, and PROBE\'s result', () => {
    expect(parseProbeLine('// probe: at 10.000,7.000 bed will contact at z=0.051000', 5)).toEqual({ kind: 'touch', x: 10, y: 7, z: 0.051, time: 5 })
    expect(parseProbeLine('// probe at 15.000,15.000 is z=-0.042500')).toMatchObject({ kind: 'touch', x: 15, y: 15, z: -0.0425 })
    expect(parseProbeLine('// Result: at 100.000,90.000 estimate contact at z=0.020000')).toMatchObject({ kind: 'result', x: 100, y: 90 })
    expect(parseProbeLine('// probe accuracy results: maximum 2.0')).toBeNull()
    expect(parseProbeLine('BED_MESH_CALIBRATE')).toBeNull()
  })

  it('counts each mesh point once however many times it is touched, and leaves homing out', () => {
    const points = meshPoints(lines(M1_RUN))
    expect(points.map(p => [p.x, p.y, +p.z.toFixed(3), p.touches])).toEqual([
      [10, 7, 0.05, 2],
      [190, 7, -0.031, 2],
      [190, 170, 0.111, 2]
    ])
    expect(homingTouches(lines(M1_RUN))).toBe(2)
  })
})

describe('placing points on the grid', () => {
  it('lays a mesh out from the printer\'s settings, as Klipper does', () => {
    expect(planFromSettings([10, 7], [190, 170], [2, 2])).toEqual([[10, 7], [190, 7], [10, 170], [190, 170]])
    expect(planFromSettings(undefined, [190, 170], [2, 2])).toBeNull()
  })

  it('puts each point in its cell by where it is, rows by Y and cells by X', () => {
    const points = meshPoints(lines(M1_RUN))
    const plan = choosePlan(points, [planFromSettings([10, 7], [190, 170], [2, 2])])
    expect(plan).not.toBeNull()
    const grid = liveGrid(points, meshLayout(plan!.map(([x, y]) => ({ x, y }))))
    expect(grid.map(r => r.map(v => (v === null ? null : +v.toFixed(3))))).toEqual([
      [0.05, -0.031],
      [null, 0.111]
    ])
  })

  it('prefers the M1\'s own plan, whose points can sit off the grid', () => {
    // A 3 x 2 print-start mesh with its middle front point moved to the edge of the no-go area.
    const plan = planFrom([[40, 20], [100, 34], [160, 20], [160, 80], [100, 80], [40, 80]])
    const touched = meshPoints(lines([
      '// probe: at 40.000,20.000 bed will contact at z=0.010000',
      '// probe: at 100.000,34.000 bed will contact at z=0.020000'
    ]))
    expect(choosePlan(touched, [plan, planFromSettings([10, 7], [190, 170], [4, 3])])).toBe(plan)
    const layout = meshLayout(plan!.map(([x, y]) => ({ x, y })))
    expect(layout).toEqual({ xs: [40, 100, 160], ys: [20, 80] })
    expect(liveGrid(touched, layout)[0]).toEqual([0.01, 0.02, null])
  })

  it('falls back to the points themselves when no plan fits', () => {
    const touched = meshPoints(lines(['// probe at 5.000,5.000 is z=0.1', '// probe at 50.000,5.000 is z=0.2']))
    expect(choosePlan(touched, [null, planFromSettings([10, 7], [190, 170], [4, 3])])).toBeNull()
    expect(liveGrid(touched, meshLayout(touched))).toEqual([[0.1, 0.2]])
  })
})

describe('what the printer is doing', () => {
  const bed = { temperature: 25, target: 0 }

  it('says it is warming the plate, then homing, with each touch that finds the plate', () => {
    expect(meshProgress({ points: [], total: 12, homingTouches: 0, homedAtStart: false, bed: { temperature: 30, target: 60 } }).text).toBe('Warming the plate to 60°C')
    expect(meshProgress({ points: [], total: 12, homingTouches: 0, homedAtStart: false, bed }).text).toBe('Homing')
    expect(meshProgress({ points: [], total: 12, homingTouches: 2, homedAtStart: false, bed }).text).toBe('Homing: finding the plate (touch 2)')
  })

  it('says it is on its way when the printer was homed already', () => {
    expect(meshProgress({ points: [], total: 12, homingTouches: 0, homedAtStart: true, bed }).text).toBe('Moving to the first point')
  })

  it('counts the points with the last height, then works out the mesh', () => {
    const points = meshPoints(lines(M1_RUN))
    expect(meshProgress({ points, total: 4, homingTouches: 2, homedAtStart: false, bed })).toMatchObject({
      phase: 'measuring',
      text: 'Touching point 4 of 4 · the last was +0.111 mm',
      done: 3,
      total: 4
    })
    expect(meshProgress({ points, total: 3, homingTouches: 2, homedAtStart: false, bed }).phase).toBe('finishing')
    expect(meshProgress({ points, total: null, homingTouches: 2, homedAtStart: false, bed }).text).toBe('Touching point 4 · the last was +0.111 mm')
  })
})
