import { describe, expect, it, test } from 'vitest'
import { fileSize, filterJobs, filterRows, isGcodeFile, isModelFile, jobFacts, jobTitle, nextSort, parentFolder, queueLabel, rangeSelect, readyChecks, shortDate, sortJobs, sortRows, tableTime, toggleKey, type TableRow } from '../model'

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

describe('Pro\'s file table', () => {
  const folder = (name: string, modified = 100): TableRow => ({ key: name, kind: 'folder', name, modified, size: 4096 })
  const file = (name: string, extra: Partial<TableRow> = {}): TableRow => ({ key: name, kind: 'file', name, modified: 100, size: 1000, ...extra })

  describe('sorting', () => {
    const rows = [
      file('b.gcode', { time: 600, size: 3000, modified: 300 }),
      folder('Zebra', 50),
      file('a.gcode', { time: 120, size: 9000, modified: 200 }),
      file('c.gcode', { size: 1, modified: 400 }),
      folder('Calibration', 500)
    ]
    const names = (sorted: TableRow[]) => sorted.map(r => r.name)

    it('puts folders first, by name, then files A to Z', () => {
      expect(names(sortRows(rows, { column: 'name', desc: false }))).toEqual(['Calibration', 'Zebra', 'a.gcode', 'b.gcode', 'c.gcode'])
    })

    it('puts a file with no value last, whichever way round', () => {
      expect(names(sortRows(rows, { column: 'time', desc: false })).slice(2)).toEqual(['a.gcode', 'b.gcode', 'c.gcode'])
      expect(names(sortRows(rows, { column: 'time', desc: true })).slice(2)).toEqual(['b.gcode', 'a.gcode', 'c.gcode'])
    })

    it('sorts folders by date when the files are', () => {
      expect(names(sortRows(rows, { column: 'modified', desc: true }))).toEqual(['Calibration', 'Zebra', 'c.gcode', 'b.gcode', 'a.gcode'])
    })

    it('never sorts folders by their directory size', () => {
      expect(names(sortRows(rows, { column: 'size', desc: true })).slice(0, 2)).toEqual(['Calibration', 'Zebra'])
    })

    it('turns a column round on a second click, and starts names A to Z and numbers biggest first', () => {
      expect(nextSort({ column: 'name', desc: false }, 'name')).toEqual({ column: 'name', desc: true })
      expect(nextSort({ column: 'name', desc: false }, 'size')).toEqual({ column: 'size', desc: true })
      expect(nextSort({ column: 'size', desc: true }, 'name')).toEqual({ column: 'name', desc: false })
    })
  })

  it('filters by name, any case', () => {
    expect(filterRows([file('Octopus.gcode'), file('dino.gcode')], ' OCTO ').map(r => r.name)).toEqual(['Octopus.gcode'])
    expect(filterRows([file('a'), file('b')], '')).toHaveLength(2)
  })

  describe('selecting', () => {
    const order = ['a', 'b', 'c', 'd', 'e']

    it('toggles a row in and out', () => {
      expect(toggleKey(['a'], 'b')).toEqual(['a', 'b'])
      expect(toggleKey(['a', 'b'], 'a')).toEqual(['b'])
    })

    it('adds the range from the last click to this one, either way up', () => {
      expect(rangeSelect(order, ['b'], 'b', 'd')).toEqual(['b', 'c', 'd'])
      expect(rangeSelect(order, ['d'], 'd', 'b')).toEqual(['d', 'b', 'c'])
    })

    it('keeps what was selected outside the range', () => {
      expect(rangeSelect(order, ['a', 'c'], 'c', 'e')).toEqual(['a', 'c', 'd', 'e'])
    })

    it('takes the row alone with nothing clicked before, or an anchor no longer shown', () => {
      expect(rangeSelect(order, [], null, 'c')).toEqual(['c'])
      expect(rangeSelect(order, [], 'gone', 'c')).toEqual(['c'])
    })

    it('ignores a row that isn\'t shown', () => {
      expect(rangeSelect(order, ['a'], 'a', 'zz')).toEqual(['a'])
    })
  })

  test.each([
    [8_800_000, '8.8 MB'],
    [940_000, '940 KB'],
    [3_900_000_000, '3.9 GB'],
    [12, '12 B']
  ])('%d bytes is %s', (bytes, text) => {
    expect(fileSize(bytes)).toBe(text)
  })

  it('dates today by the clock, this year by the day, and older with the year', () => {
    const now = new Date(2026, 9, 11, 18, 0)
    expect(shortDate(new Date(2026, 9, 11, 14, 2).getTime() / 1000, now)).toBe('today 14:02')
    expect(shortDate(new Date(2026, 9, 8, 9, 0).getTime() / 1000, now)).toBe('08 Oct')
    expect(shortDate(new Date(2025, 8, 26).getTime() / 1000, now)).toBe('26 Sep 2025')
    expect(shortDate(0, now)).toBe('')
  })

  test.each([
    [53 * 60 + 9, '53m 9s'],
    [84 * 60 + 20, '1h 24m'],
    [42, '42s'],
    [undefined, '—']
  ])('%s seconds prints as %s', (seconds, text) => {
    expect(tableTime(seconds)).toBe(text)
  })

  it('finds the folder above', () => {
    expect(parentFolder('Calibration/Cubes')).toBe('Calibration')
    expect(parentFolder('Calibration')).toBe('')
  })

  test.each([[1, 'Queue it'], [2, 'Queue both'], [5, 'Queue all 5']])('queueing %d says %s', (n, text) => {
    expect(queueLabel(n)).toBe(text)
  })
})
