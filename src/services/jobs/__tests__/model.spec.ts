import { describe, expect, it, test } from 'vitest'
import { filterJobs, isGcodeFile, isModelFile, jobFacts, jobTitle, readyChecks, sortJobs } from '../model'

describe('a job\'s title', () => {
  test.each([
    ['octopus_brain_keychain+8_0.2mm_PLA_Muon3D M1_53m9s.gcode', 'Octopus brain keychain ×8'],
    ['minisaur_-_smooth_0.2mm_PLA_Muon3D M1_22m37s.gcode', 'Minisaur smooth'],
    ['Flexi-Leaf-Dragon-Medium_0.2mm_PLA_Muon3D M1_2h14m.gcode', 'Flexi Leaf Dragon Medium'],
    ['prints/calibration_cube.gcode', 'Calibration cube'],
    ['M1_bracket_PLA_0.2mm.gcode', 'M1 bracket PLA'],
    ['bracket.bgcode', 'Bracket'],
    ['0.2mm_only.gcode', '0.2mm only']
  ])('%s is %s', (file, title) => {
    expect(jobTitle(file)).toBe(title)
  })
})

describe('a job\'s facts', () => {
  it('give the time and the filament', () => {
    expect(jobFacts({ estimated_time: 53 * 60, filament_weight_total: 26.1, filament_type: 'PLA' })).toBe('53 min · 26 g PLA')
  })

  it('keep the first material of several', () => {
    expect(jobFacts({ filament_type: 'PLA;PETG' })).toBe('PLA')
  })

  it('are empty with no metadata', () => {
    expect(jobFacts(undefined)).toBe('')
  })
})

describe('the files on the printer', () => {
  const files = [
    { filename: 'b.gcode', modified: 2, estimated_time: 600, history: {} },
    { filename: 'a.gcode', modified: 3, estimated_time: 60, print_start_time: 1000 },
    { filename: 'c.gcode', modified: 1, history: { job_id: '0001' } }
  ]

  it('can show those never printed, or printed before', () => {
    expect(filterJobs(files, 'never').map(f => f.filename)).toEqual(['b.gcode'])
    expect(filterJobs(files, 'before').map(f => f.filename)).toEqual(['a.gcode', 'c.gcode'])
  })

  it('sort newest first, by name, or quickest first', () => {
    expect(sortJobs(files, 'newest').map(f => f.filename)).toEqual(['a.gcode', 'b.gcode', 'c.gcode'])
    expect(sortJobs(files, 'name').map(f => f.filename)).toEqual(['a.gcode', 'b.gcode', 'c.gcode'])
    expect(sortJobs(files, 'time').map(f => f.filename)).toEqual(['a.gcode', 'b.gcode', 'c.gcode'])
  })
})

describe('before a dropped file prints', () => {
  it('says it was sliced for the M1, and the material matches', () => {
    expect(readyChecks({ filament_type: 'PLA', slicer: 'OrcaSlicer' }, 'minisaur_0.2mm_PLA_Muon3D M1_22m.gcode', 'PLA', 'Boxwood', false)).toEqual([
      { ok: true, text: 'Sliced for the Muon3D M1' },
      { ok: true, text: 'Needs PLA · PLA is set' }
    ])
  })

  it('warns of another material, another printer, and a busy printer', () => {
    const checks = readyChecks({ filament_type: 'PETG', slicer: 'PrusaSlicer' }, 'part.gcode', 'PLA', 'Boxwood', true)
    expect(checks.map(c => c.text)).toEqual([
      'Sliced with PrusaSlicer; not marked for the M1',
      'Needs PETG · PLA is set',
      'Boxwood is busy · it can go next in the queue'
    ])
    expect(checks.every(c => c.warn)).toBe(true)
  })
})

describe('a dropped file', () => {
  test.each([['lizard.stl', true], ['plate.3mf', true], ['part.STEP', true], ['part.gcode', false]])('%s opens in Slice: %s', (name, model) => {
    expect(isModelFile(name)).toBe(model)
  })

  it('prints when it is G-code', () => {
    expect(isGcodeFile('part.gcode')).toBe(true)
    for (const name of ['part.g', 'part.gc', 'part.gco', 'part.ufp', 'part.nc', 'part.bgcode']) expect(isGcodeFile(name), name).toBe(true)
    expect(isGcodeFile('part.stl')).toBe(false)
  })
})
