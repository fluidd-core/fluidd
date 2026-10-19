import { describe, expect, it } from 'vitest'
import { bedMiddle, checkCommand, checkProduced, checkStatus, daysAgo, meshColor, meshProfileCommand, meshSummary, meshValue, parseProbeAccuracy, probeCount, probeAccuracyScript, probeVerdict, touchesPlate, validProfileName } from '../model'
import type { CheckEvidence } from '../model'

describe('the checks that touch the plate', () => {
  it('are levelling and first layer height, which ask the plate check as a print does', () => {
    expect(touchesPlate('bedMesh')).toBe(true)
    expect(touchesPlate('firstLayer')).toBe(true)
    expect(touchesPlate('shaper')).toBe(false)
    expect(touchesPlate('pid')).toBe(false)
  })
})

const DAY = 86_400_000
const now = 1_760_000_000_000

it.each(['[[null]]', '[["bad"]]', '[[0.1],[]]', '[[0.1],[0.2,0.3]]', 'not json', '{}'])('does not record a completed bed measurement from %s', mesh => {
  expect(checkProduced('bedMesh', { mesh: '[]', pending: {} }, { mesh, pending: {} })).toBe(false)
})

for (const value of ['', 'NaN', 'not measured']) {
  it.each([
    ['shaper', 'input_shaper', 'shaper_freq_x'],
    ['pid', 'extruder', 'pid_kp'],
    ['firstLayer', 'probe', 'z_offset']
  ] as const)('does not record %s with an invalid numeric report', (id, section, key) => {
    const before = { mesh: '[]', pending: {} }
    expect(checkProduced(id, before, { ...before, pending: { [section]: { [key]: value } } })).toBe(false)
  })
}

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

describe('the mesh settings', () => {
  it('reads one probe count as both directions', () => {
    expect(probeCount([7, 5])).toEqual([7, 5])
    expect(probeCount(5)).toEqual([5, 5])
    expect(probeCount(undefined)).toBeNull()
  })
})

describe('the Bed mesh page', () => {
  it('reads PROBE_ACCURACY\'s result line', () => {
    const line = '// probe accuracy results: maximum 2.003750, minimum 1.995000, range 0.008750, average 1.999188, median 1.999375, standard deviation 0.002313'
    expect(parseProbeAccuracy(line)).toEqual({ maximum: 2.00375, minimum: 1.995, range: 0.00875, average: 1.999188, median: 1.999375, stddev: 0.002313 })
    expect(parseProbeAccuracy('// probe at 100.000,100.000 is z=1.999375')).toBeNull()
  })

  it('reads a negative probe height', () => {
    expect(parseProbeAccuracy('probe accuracy results: maximum -0.010000, minimum -0.020000, range 0.010000, average -0.015000, median -0.015000, standard deviation 0.004000')?.minimum).toBe(-0.02)
  })

  it('calls a probe repeatable within a few microns', () => {
    expect(probeVerdict(0.0023).tone).toBe('ok')
    expect(probeVerdict(0.005).tone).toBe('warn')
    expect(probeVerdict(0.02).text).toMatch(/^Spread out/)
  })

  it('takes profile names Klipper can, and quotes them', () => {
    expect(validProfileName('default')).toBe(true)
    expect(validProfileName('PETG 80C')).toBe(true)
    expect(validProfileName('bad"name')).toBe(false)
    expect(validProfileName(' ')).toBe(false)
    expect(meshProfileCommand('SAVE', ' PETG 80C ')).toBe('BED_MESH_PROFILE SAVE="PETG 80C"')
  })
})

describe('probe accuracy', () => {
  it('probes the middle of the meshed area, or of the axes', () => {
    expect(bedMiddle([10, 10], [190, 170], [0, 0], [200, 200])).toEqual([100, 90])
    expect(bedMiddle(undefined, undefined, [0, -5], [235, 225])).toEqual([118, 110])
  })

  it('homes first when it hasn\'t, then goes there and probes', () => {
    expect(probeAccuracyScript(false, [100, 90])).toBe('G28\nG90\nG1 X100 Y90 F6000\nPROBE_ACCURACY')
    expect(probeAccuracyScript(true, [100, 90])).toBe('G90\nG1 X100 Y90 F6000\nPROBE_ACCURACY')
  })
})
