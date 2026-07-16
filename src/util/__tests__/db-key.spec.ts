import dbKey from '../db-key'

describe('dbKey', () => {
  it.each([
    [dbKey`uiSettings`, ['uiSettings']],
    [dbKey`uiSettings.dashboard`, ['uiSettings', 'dashboard']],
    [dbKey`uiSettings.dashboard.sensorColors`, ['uiSettings', 'dashboard', 'sensorColors']],
  ])('splits static dotted key %s into segments', (result, expected) => {
    expect(result).toStrictEqual(expected)
  })

  it('appends a simple dynamic value as a single segment', () => {
    const key = 'extruder'
    expect(dbKey`uiSettings.dashboard.sensorColors.${key}`).toStrictEqual([
      'uiSettings', 'dashboard', 'sensorColors', 'extruder',
    ])
  })

  it('keeps dots inside a dynamic value unsplit', () => {
    const key = 'temperature_sensor my.sensor'
    expect(dbKey`uiSettings.dashboard.sensorColors.${key}`).toStrictEqual([
      'uiSettings', 'dashboard', 'sensorColors', 'temperature_sensor my.sensor',
    ])
  })

  it('handles a dynamic value in the middle of the key', () => {
    const root = 'gcodes'
    expect(dbKey`uiSettings.fileSystem.activeFilters.${root}.extra`).toStrictEqual([
      'uiSettings', 'fileSystem', 'activeFilters', 'gcodes', 'extra',
    ])
  })

  it('handles multiple dynamic values', () => {
    const ns = 'dashboard'
    const key = 'my.heater'
    expect(dbKey`uiSettings.${ns}.sensorColors.${key}`).toStrictEqual([
      'uiSettings', 'dashboard', 'sensorColors', 'my.heater',
    ])
  })

  it('filters out empty segments from leading, trailing, or consecutive dots', () => {
    const key = 'value'
    expect(dbKey`..a..b..${key}..`).toStrictEqual(['a', 'b', 'value'])
  })
})
