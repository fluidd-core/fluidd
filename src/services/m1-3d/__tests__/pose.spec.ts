import { describe, expect, it } from 'vitest'
import { RESTING, modelPose, placeModel, samePose, type Calibration, type PrinterPose } from '../pose'

const printer: PrinterPose = { position: [100, 90, 12.5], homed: 'xyz', lights: true, progress: 41.6 }

// A plate 200 wide from x -110 and 180 deep with its front at z 70; the tip
// at (-15, 93, -40) with the head centred; the plate's underside at 98 with
// the bed at the bottom.
const cal: Calibration = {
  plateLeft: -110,
  plateFront: 70,
  plateUnderside: 98,
  nozzleX: -15,
  nozzleZ: -40,
  tipTop: 93,
  travelX: 100,
  travelZ: 92,
  bedTravel: 164
}

describe("the printer's pose", () => {
  it('is its position in millimetres, with the lights and progress', () => {
    expect(modelPose(printer)).toEqual({ x: 100, y: 90, z: 12.5, led: true, progress: 42 })
  })

  it("has no position for an axis that isn't homed, since Klipper reports 0 for it", () => {
    expect(modelPose({ ...printer, homed: 'z', position: [0, 0, 5] })).toMatchObject({ x: null, y: null, z: 5 })
  })

  it('redraws only for a change that shows', () => {
    const a = modelPose(printer)
    expect(samePose(a, modelPose({ ...printer, position: [100.02, 90, 12.5] }))).toBe(true)
    expect(samePose(a, modelPose({ ...printer, position: [101, 90, 12.5] }))).toBe(false)
    expect(samePose(a, modelPose({ ...printer, homed: 'yz' }))).toBe(false)
    expect(samePose(a, modelPose({ ...printer, lights: false }))).toBe(false)
    expect(samePose(null, a)).toBe(false)
  })
})

describe('placing the model', () => {
  const tipAt = (pose = modelPose(printer)) => {
    const p = placeModel(pose, cal)
    return {
      x: cal.nozzleX + p.headX * cal.travelX,
      z: cal.nozzleZ + p.headZ * cal.travelZ,
      gap: cal.plateUnderside + p.z * cal.bedTravel - cal.tipTop
    }
  }

  it('puts the tip over the plate point the printer means, X from the left edge and Y from the front', () => {
    const tip = tipAt()
    expect(tip.x).toBeCloseTo(cal.plateLeft + 100)
    expect(tip.z).toBeCloseTo(cal.plateFront - 90)
  })

  it('holds the plate Z above the tip, so a print on the plate meets the nozzle', () => {
    expect(tipAt().gap).toBeCloseTo(12.5)
    expect(tipAt(modelPose({ ...printer, position: [100, 90, 0] })).gap).toBeCloseTo(0)
  })

  it('rests an axis that isn\'t homed', () => {
    expect(placeModel(modelPose({ ...printer, homed: '' }), cal)).toEqual(RESTING)
  })

  it('keeps the head on its rails and the bed on its mast', () => {
    const p = placeModel({ x: 900, y: -900, z: 900, led: false, progress: 0 }, cal)
    expect(p).toEqual({ headX: 1.05, headZ: 1.05, z: 1.05 })
  })
})
