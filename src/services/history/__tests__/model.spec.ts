import { describe, expect, it, test } from 'vitest'
import { dayLabel, filterHistory, finishedShare, groupByDay, historyStatus, metres, slicerFacts } from '../model'

describe('how a print ended', () => {
  test.each([
    ['completed', 'Finished', 'finished'],
    ['in_progress', 'Printing', 'printing'],
    ['error', 'Failed', 'failed'],
    ['klippy_shutdown', 'Failed', 'failed'],
    ['interrupted', 'Failed', 'failed'],
    ['cancelled', 'Stopped', 'stopped']
  ])('%s is %s', (status, text, kind) => {
    expect(historyStatus(status)).toMatchObject({ text, kind })
  })

  it('says how far a stopped print got', () => {
    expect(historyStatus('cancelled', 420, 4200).text).toBe('Stopped at 10%')
  })

  it('shows an unknown status as it is', () => {
    expect(historyStatus('something_new')).toEqual({ kind: 'other', text: 'something_new', tone: 'off' })
  })
})

describe('filtering', () => {
  const items = [
    { filename: 'a/Benchy.gcode', status: 'completed' },
    { filename: 'cube.gcode', status: 'cancelled' },
    { filename: 'benchy_v2.gcode', status: 'error' }
  ]

  it('keeps one kind', () => {
    expect(filterHistory(items, 'stopped', '').map(i => i.filename)).toEqual(['cube.gcode'])
    expect(filterHistory(items, 'failed', '').map(i => i.filename)).toEqual(['benchy_v2.gcode'])
  })

  it('finds by file name, any case', () => {
    expect(filterHistory(items, 'all', 'BENCHY')).toHaveLength(2)
    expect(filterHistory(items, 'finished', 'benchy')).toHaveLength(1)
  })
})

describe('days', () => {
  const now = new Date(2026, 9, 11, 18, 0)
  const at = (y: number, mo: number, d: number, h = 12) => new Date(y, mo, d, h).getTime() / 1000

  it('names today and yesterday, then the day', () => {
    expect(dayLabel(at(2026, 9, 11, 1), now)).toBe('Today')
    expect(dayLabel(at(2026, 9, 10, 23), now)).toBe('Yesterday')
    expect(dayLabel(at(2026, 9, 3), now)).toBe('Sat 3 Oct')
    expect(dayLabel(at(2025, 11, 31), now)).toBe('Wed 31 Dec 2025')
  })

  it('groups prints by the day they started, newest first', () => {
    const groups = groupByDay([
      { start_time: at(2026, 9, 10, 9) },
      { start_time: at(2026, 9, 11, 9) },
      { start_time: at(2026, 9, 10, 15) }
    ], now)
    expect(groups.map(g => [g.label, g.items.length])).toEqual([['Today', 1], ['Yesterday', 2]])
    expect(groups[1].items[0].start_time).toBe(at(2026, 9, 10, 15))
  })
})

describe('numbers', () => {
  test.each([[850, '0.85 m'], [12_400, '12.4 m'], [1_240_000, '1,240 m']])('%d mm is %s', (mm, text) => {
    expect(metres(mm)).toBe(text)
  })

  it('counts the finished', () => {
    expect(finishedShare([{ status: 'completed' }, { status: 'error' }, { status: 'completed' }])).toBe('2 of the last 3 finished')
  })

  it('picks the slicer facts people check, in order', () => {
    expect(slicerFacts({ slicer: 'OrcaSlicer', slicer_version: '2.3.0', filament_type: 'PLA;PETG', layer_height: 0.2, first_layer_extr_temp: 220, filament_weight_total: 26.1, size: 4 }))
      .toEqual([
        { label: 'Slicer', value: 'OrcaSlicer 2.3.0' },
        { label: 'Material', value: 'PLA' },
        { label: 'Layer height', value: '0.2 mm' },
        { label: 'Nozzle', value: '220° first layer' },
        { label: 'Planned filament', value: '26 g' }
      ])
    expect(slicerFacts(undefined)).toEqual([])
  })
})
