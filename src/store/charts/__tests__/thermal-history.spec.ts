import { buildThermalHistoryBuffer } from '../thermal-history'
import { chartBufferSource } from '@/util/chart-buffer'

const END = 1_000_000

const series = (length: number, value: (index: number) => number): number[] =>
  Array.from({ length }, (_, index) => value(index))

describe('buildThermalHistoryBuffer', () => {
  it('maps a full-length history onto a 1Hz timeline ending at endTime', () => {
    const buffer = buildThermalHistoryBuffer(
      { extruder: { temperatures: [10, 20, 30] } },
      ['extruder'],
      600,
      END
    )

    const source = chartBufferSource(buffer)

    expect(buffer.count).toBe(3)
    expect(Array.from(source.date)).toEqual([END - 3000, END - 2000, END - 1000])
    expect(Array.from(source.extruder)).toEqual([10, 20, 30])
  })

  it('right-aligns a short history instead of padding it', () => {
    const buffer = buildThermalHistoryBuffer(
      {
        extruder: { temperatures: [10, 20, 30, 40] },
        heater_bed: { temperatures: [60] }
      },
      ['extruder', 'heater_bed'],
      600,
      END
    )

    const { heater_bed: bed } = chartBufferSource(buffer)

    expect(buffer.count).toBe(4)
    expect(bed[3]).toBe(60)
    expect(Number.isNaN(bed[0])).toBe(true)
    expect(Number.isNaN(bed[1])).toBe(true)
    expect(Number.isNaN(bed[2])).toBe(true)
  })

  it('keeps the newest samples when history exceeds retention', () => {
    const buffer = buildThermalHistoryBuffer(
      { extruder: { temperatures: series(10, i => i) } },
      ['extruder'],
      4,
      END
    )

    expect(buffer.count).toBe(4)
    expect(Array.from(chartBufferSource(buffer).extruder)).toEqual([6, 7, 8, 9])
  })

  it('aligns ragged sensors onto one shared timeline', () => {
    const buffer = buildThermalHistoryBuffer(
      {
        extruder: { temperatures: series(600, i => i) },
        heater_bed: { temperatures: series(100, i => i) }
      },
      ['extruder', 'heater_bed'],
      600,
      END
    )

    const source = chartBufferSource(buffer)

    expect(buffer.count).toBe(600)
    expect(source.date.length).toBe(600)
    expect(source.extruder.length).toBe(600)
    expect(source.heater_bed.length).toBe(600)
    expect(source.extruder[599]).toBe(599)
    expect(source.heater_bed[599]).toBe(99)
    expect(Number.isNaN(source.heater_bed[499])).toBe(true)
    expect(source.heater_bed[500]).toBe(0)
  })

  it('builds a column per populated field', () => {
    const buffer = buildThermalHistoryBuffer(
      {
        extruder: { temperatures: [10], targets: [200], powers: [0.5] },
        'temperature_fan chamber': { temperatures: [30], speeds: [0.25] }
      },
      ['extruder', 'temperature_fan chamber'],
      600,
      END
    )

    expect([...buffer.columns.keys()].sort()).toEqual([
      'extruder',
      'extruder#power',
      'extruder#target',
      'temperature_fan chamber',
      'temperature_fan chamber#speed'
    ])
  })

  it('drops bogus targets for probes and sensors, keeps them for heaters', () => {
    const buffer = buildThermalHistoryBuffer(
      {
        heater_bed: { temperatures: [60], targets: [60] },
        'temperature_sensor mcu': { temperatures: [40], targets: [0] },
        'temperature_probe eddy': { temperatures: [35], targets: [0] }
      },
      ['heater_bed', 'temperature_sensor mcu', 'temperature_probe eddy'],
      600,
      END
    )

    expect(buffer.columns.has('heater_bed#target')).toBe(true)
    expect(buffer.columns.has('temperature_sensor mcu#target')).toBe(false)
    expect(buffer.columns.has('temperature_probe eddy#target')).toBe(false)
  })

  it('ignores sensors that are not chartable', () => {
    const buffer = buildThermalHistoryBuffer(
      {
        extruder: { temperatures: [10] },
        'temperature_sensor _hidden': { temperatures: [40] }
      },
      ['extruder'],
      600,
      END
    )

    expect([...buffer.columns.keys()]).toEqual(['extruder'])
  })

  it('ignores chartable sensors missing from the payload', () => {
    const buffer = buildThermalHistoryBuffer(
      { extruder: { temperatures: [10] } },
      ['extruder', 'heater_bed'],
      600,
      END
    )

    expect([...buffer.columns.keys()]).toEqual(['extruder'])
  })

  it('skips empty field arrays', () => {
    const buffer = buildThermalHistoryBuffer(
      { extruder: { temperatures: [10], targets: [] } },
      ['extruder'],
      600,
      END
    )

    expect(buffer.columns.has('extruder#target')).toBe(false)
  })

  it('rounds values to 2 decimal places, matching the live path', () => {
    const buffer = buildThermalHistoryBuffer(
      { extruder: { temperatures: [10.126, 20.124] } },
      ['extruder'],
      600,
      END
    )

    expect(Array.from(chartBufferSource(buffer).extruder)).toEqual([10.13, 20.12])
  })

  it('yields an empty buffer for an empty payload', () => {
    const buffer = buildThermalHistoryBuffer({}, ['extruder'], 600, END)

    expect(buffer.count).toBe(0)
    expect([...buffer.columns.keys()]).toEqual([])
  })

  it('yields an empty buffer when there are no chartable sensors', () => {
    const buffer = buildThermalHistoryBuffer(
      { extruder: { temperatures: [10, 20] } },
      [],
      600,
      END
    )

    expect(buffer.count).toBe(0)
  })

  it('does not mutate the payload', () => {
    const payload = {
      'temperature_sensor mcu': { temperatures: [40, 41], targets: [0, 0] },
      extruder: { temperatures: series(10, i => i) }
    }
    const before = structuredClone(payload)

    buildThermalHistoryBuffer(payload, ['temperature_sensor mcu', 'extruder'], 4, END)

    expect(payload).toEqual(before)
  })
})
