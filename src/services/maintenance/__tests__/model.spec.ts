import { describe, expect, it } from 'vitest'
import { checkCommand, checkProduced, checkStatus, daysAgo, liveMesh, meshColor, meshSummary, meshValue, probeCount, probedHeights } from '../model'
import type { CheckEvidence } from '../model'

const DAY = 86_400_000
const now = 1_760_000_000_000

describe('a check\'s status', () => {
  it('asks for a bed mesh never run from here', () => {
    expect(checkStatus('bedMesh', undefined, now)).toMatchObject({ tone: 'warn', due: true })
  })

  it('leaves the others alone until they have run', () => {
    expect(checkStatus('shaper', undefined, now)).toEqual({ tone: 'off', text: 'Not run yet', due: false })
  })

  it('is good while recent', () => {
    expect(checkStatus('bedMesh', now - 3 * DAY, now)).toEqual({ tone: 'ok', text: 'Good · 3 days ago', due: false })
  })

  it('is due once old', () => {
    expect(checkStatus('bedMesh', now - 41 * DAY, now)).toEqual({ tone: 'warn', text: 'Due · last run 41 days ago', due: true })
    expect(checkStatus('shaper', now - 41 * DAY, now).due).toBe(false)
  })

  it('says today and yesterday in words', () => {
    expect(daysAgo(now - 2 * 3600_000, now)).toBe('today')
    expect(daysAgo(now - 30 * 3600_000, now)).toBe('yesterday')
  })
})

describe('the bed mesh', () => {
  it('is flat enough within a quarter of a millimetre', () => {
    expect(meshSummary([[0.01, 0.05], [-0.1, 0.11]])).toMatchObject({ range: 0.21, tone: 'ok' })
  })

  it('is uneven beyond it, and very uneven past 0.6 mm', () => {
    expect(meshSummary([[0, 0.4]])?.tone).toBe('warn')
    expect(meshSummary([[-0.4, 0.4]])?.tone).toBe('err')
  })

  it('has no summary without a mesh', () => {
    expect(meshSummary(undefined)).toBeNull()
    expect(meshSummary([])).toBeNull()
  })

  it('prints a point a hair below zero as 0.00', () => {
    expect(meshValue(-0.001)).toBe('0.00')
    expect(meshValue(-0.012)).toBe('-0.01')
  })

  it('colours low points blue and high points amber', () => {
    expect(meshColor(0, 0, 1)).toBe('rgb(59, 130, 246)')
    expect(meshColor(1, 0, 1)).toBe('rgb(232, 150, 60)')
  })
})

describe('whether a check produced a result', () => {
  const none: CheckEvidence = { mesh: '[[0,0.1]]', pending: {} }

  it('counts a new mesh, not the same one or none', () => {
    expect(checkProduced('bedMesh', none, { ...none, mesh: '[[0,0.2]]' })).toBe(true)
    expect(checkProduced('bedMesh', none, none)).toBe(false)
    expect(checkProduced('bedMesh', none, { ...none, mesh: '[]' })).toBe(false)
  })

  it('counts the setting each check writes, waiting to be saved', () => {
    expect(checkProduced('pid', none, { ...none, pending: { extruder: { control: 'pid', pid_kp: '21.5' } } })).toBe(true)
    expect(checkProduced('shaper', none, { ...none, pending: { input_shaper: { shaper_type_x: 'mzv', shaper_freq_x: '52.4' } } })).toBe(true)
    expect(checkProduced('firstLayer', none, { ...none, pending: { probe: { z_offset: '-0.612' } } })).toBe(true)
    expect(checkProduced('firstLayer', none, { ...none, pending: { stepper_z: { position_endstop: '0.41' } } })).toBe(true)
  })

  it('ignores another check\'s result, and one already there before', () => {
    const tuned = { ...none, pending: { extruder: { pid_kp: '21.5' } } }
    expect(checkProduced('shaper', none, tuned)).toBe(false)
    expect(checkProduced('pid', tuned, tuned)).toBe(false)
  })
})

describe('what a check runs', () => {
  const all = { BED_MESH_CALIBRATE: {}, PROBE_CALIBRATE: {}, Z_ENDSTOP_CALIBRATE: {}, SHAPER_CALIBRATE: {}, PID_CALIBRATE: {} }

  it('homes first when the printer isn\'t homed', () => {
    expect(checkCommand('bedMesh', { commands: all, homed: false, nozzleTarget: 215 })).toBe('G28\nBED_MESH_CALIBRATE')
    expect(checkCommand('bedMesh', { commands: all, homed: true, nozzleTarget: 215 })).toBe('BED_MESH_CALIBRATE')
  })

  it('tunes the nozzle at the material\'s temperature, without homing', () => {
    expect(checkCommand('pid', { commands: all, homed: false, nozzleTarget: 240.4 })).toBe('PID_CALIBRATE HEATER=extruder TARGET=240')
  })

  it("uses the printer's own heater tuning macro when it has one", () => {
    expect(checkCommand('pid', { commands: { ...all, CALIBRATE_HEATING_HOTEND: {} }, homed: false, nozzleTarget: 240 })).toBe('CALIBRATE_HEATING_HOTEND')
  })

  it('uses the probe for the first layer, else the Z endstop', () => {
    expect(checkCommand('firstLayer', { commands: all, homed: true, nozzleTarget: 215 })).toBe('PROBE_CALIBRATE')
    expect(checkCommand('firstLayer', { commands: { Z_ENDSTOP_CALIBRATE: {} }, homed: true, nozzleTarget: 215 })).toBe('Z_ENDSTOP_CALIBRATE')
  })

  it('has nothing to run without the hardware', () => {
    expect(checkCommand('shaper', { commands: { BED_MESH_CALIBRATE: {} }, homed: true, nozzleTarget: 215 })).toBeNull()
  })
})

describe('the mesh while it\'s measured', () => {
  it('reads the heights from Klipper\'s probe lines', () => {
    expect(probedHeights([
      '// probe at 15.000,15.000 is z=0.042500',
      'BED_MESH_CALIBRATE',
      '// probe at 117.500,15.000 is z=-0.031250'
    ])).toEqual([0.0425, -0.03125])
  })

  it('fills rows from the front, turning at each end', () => {
    expect(liveMesh([1, 2, 3, 4, 5], 3, 2)).toEqual([[1, 2, 3], [null, 5, 4]])
  })

  it('reads one probe count as both directions', () => {
    expect(probeCount([7, 5])).toEqual([7, 5])
    expect(probeCount(5)).toEqual([5, 5])
    expect(probeCount(undefined)).toBeNull()
  })
})
