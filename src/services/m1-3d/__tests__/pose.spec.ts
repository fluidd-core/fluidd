import { describe, expect, it } from 'vitest'
import { RESTING, modelPose, samePose, type PrinterPose } from '../pose'

const m1: PrinterPose = {
  position: [100.05, 82.05, 78],
  axisMin: [0, -10, -4],
  axisMax: [200.1, 174.1, 160],
  homed: 'xyz',
  lights: true,
  progress: 41.6
}

describe("the live M1's pose", () => {
  it('puts the head mid-rail and the bed mid-travel at the middle of each axis', () => {
    expect(modelPose(m1)).toEqual({ headX: 0, headZ: 0, z: 0.5, led: true, progress: 42 })
  })

  it('runs X left to right, and Y from the front at its lowest to the back at its highest', () => {
    const corner = modelPose({ ...m1, position: [200.1, 174.1, -4] })
    expect(corner).toMatchObject({ headX: 1, headZ: -1, z: 0 })
    expect(modelPose({ ...m1, position: [0, -10, 160] })).toMatchObject({ headX: -1, headZ: 1, z: 1 })
  })

  it('rests an axis that isn\'t homed, since Klipper reports 0 for it', () => {
    expect(modelPose({ ...m1, homed: 'z', position: [0, 0, 78] })).toMatchObject({ headX: RESTING.headX, headZ: RESTING.headZ, z: 0.5 })
    expect(modelPose({ ...m1, homed: '' })).toMatchObject(RESTING)
  })

  it('keeps a position past an end on the machine', () => {
    expect(modelPose({ ...m1, position: [260, -40, 400] })).toMatchObject({ headX: 1, headZ: 1, z: 1 })
  })

  it('falls back to the M1\'s own travel when Klipper hasn\'t said', () => {
    expect(modelPose({ ...m1, axisMin: [], axisMax: [] })).toMatchObject({ headX: 0, headZ: 0, z: 0.5 })
  })

  it('redraws only for a change that shows', () => {
    const a = modelPose(m1)
    expect(samePose(a, modelPose({ ...m1, position: [100.06, 82.05, 78] }))).toBe(true)
    expect(samePose(a, modelPose({ ...m1, position: [101, 82.05, 78] }))).toBe(false)
    expect(samePose(a, modelPose({ ...m1, lights: false }))).toBe(false)
    expect(samePose(null, a)).toBe(false)
  })
})
