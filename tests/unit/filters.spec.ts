import { expect } from 'chai'

import { Filters } from '@/plugins/filters'
import { DayJSPlugin } from '@/plugins/dayjs'
import Vue from 'vue'

// formatCounterTime

describe('formatCounterTime', () => {
  it('format negative numbers properly', () => {
    expect(Filters.formatCounterTime(-9999)).to.equal('-2h 46m 39s')
  })

  it('naively converts floats to number', () => {
    expect(Filters.formatCounterTime(120.42)).to.equal('2m 0s')
  })

  it('converts NaN or Infinity to zero', () => {
    expect(Filters.formatCounterTime(NaN)).to.equal('0m 0s')
    expect(Filters.formatCounterTime(Infinity)).to.equal('0m 0s')
  })

  it('format 0 properly', () => {
    expect(Filters.formatCounterTime(0)).to.equal('0m 0s')
  })

  it('format 60 properly', () => {
    expect(Filters.formatCounterTime(60)).to.equal('1m 0s')
  })

  it('shows hours when relevent', () => {
    expect(Filters.formatCounterTime(3600)).to.equal('1h 0m 0s')
  })

  it('format 3600 * 24 properly', () => {
    expect(Filters.formatCounterTime(3600 * 24)).to.equal('24h 0m 0s')
  })
})

// formatFileDateTime

describe('formatDateTime', () => {
  Vue.use(DayJSPlugin)
  it('renders numbers as date with offset applied', () => {
    // This should return based on your browsers local time, given unixtime.
    const d = new Date(0)
    const offset = d.getTimezoneOffset()
    const d2 = new Date(d.getTime() + offset * 60)
    expect(Filters.formatDateTime(d2.getTime())).to.equal('Jan 1, 1970 12:00 AM')
  })

  it('renders dates that are the same day as human readable', () => {
    const d = new Date()
    const d2 = new Date()
    d2.setSeconds(d.getSeconds() + 10)
    expect(Filters.formatDateTime(d2.getTime() / 1000)).to.equal('in a few seconds')
  })
})

// formatAbsoluteDateTime

describe('formatAbsoluteDateTime', () => {
  Vue.use(DayJSPlugin)
  it('renders numbers as date with offset applied', () => {
    // This should return based on your browsers local time, given unixtime.
    const d = new Date(0)
    const offset = d.getTimezoneOffset()
    const d2 = new Date(d.getTime() + offset * 60)
    expect(Filters.formatAbsoluteDateTime(d2.getTime())).to.equal('Jan 1, 12:00 AM')
  })
})

// getReadableLengthString

describe('getReadableLengthString', () => {
  it('renders length under 100mm as mm', () => {
    expect(Filters.getReadableLengthString(99)).to.equal('99.0 mm')
  })

  it('renders length over 100mm as cm', () => {
    expect(Filters.getReadableLengthString(101)).to.equal('10.1 cm')
  })

  it('renders length over or equal to 1000mm as meters', () => {
    expect(Filters.getReadableLengthString(1000)).to.equal('1.00 m')
    expect(Filters.getReadableLengthString(1111)).to.equal('1.11 m')
  })
})

// camelCase

describe('camelCase', () => {
  it('converts snake case to camelCase', () => {
    expect(Filters.camelCase('snake-case')).to.equal('snakeCase')
  })
})

// capitalize

describe('capitalize', () => {
  it('capitalizes passed string', () => {
    expect(Filters.capitalize('TEST_STRING')).to.equal('Teststring')
  })
})

// getReadableFileSizeString

describe('getReadableFileSizeString', () => {
  it('rounds smaller numbers properly', () => {
    expect(Filters.getReadableFileSizeString(-1000)).to.equal('0.1 kB')
    expect(Filters.getReadableFileSizeString(0)).to.equal('0 kB')
  })

  it('renders Yoddabytes properly', () => {
    expect(Filters.getReadableFileSizeString(Math.pow(1024, 9))).to.equal('1024.0YB')
  })
})

// fileSystemSort

describe('fileSystemSort', () => {
  const files = [
    {
      name: 'foo.bar',
      size: 1024,
      description: 'the default file',
      type: 'file'
    },
    {
      name: 'z_idlers',
      size: 4,
      description: null,
      type: 'directory'
    },
    {
      name: 'bar.buz',
      size: 500,
      description: 'bar',
      type: 'file'
    },
    {
      name: 'âccentués.gcode',
      size: 42,
      description: null,
      type: 'file'
    },
    {
      name: 'accentues.gcode',
      size: 42,
      description: null,
      type: 'file'
    },
    {
      name: 'accents',
      size: 4,
      description: null,
      type: 'directory'
    },
    {
      name: 'marvin.gcode',
      size: 500,
      description: null,
      type: 'file'
    },
    {
      name: 'benchy.gcode',
      size: 2020,
      description: 'a test file',
      type: 'file'
    }
  ]

  it('sorts by name', () => {
    expect(Filters.fileSystemSort(files, ['name'], [false], 'en-us')).to.deep.equal(
      [
        {
          description: 'the default file',
          name: 'foo.bar',
          size: 1024,
          type: 'file'
        },
        {
          description: null,
          name: 'z_idlers',
          size: 4,
          type: 'directory'
        },
        {
          description: null,
          name: 'accentues.gcode',
          size: 42,
          type: 'file'
        },
        {
          description: null,
          name: 'âccentués.gcode',
          size: 42,
          type: 'file'
        },
        {
          description: 'bar',
          name: 'bar.buz',
          size: 500,
          type: 'file'
        },
        {
          description: null,
          name: 'accents',
          size: 4,
          type: 'directory'
        },
        {
          description: 'a test file',
          name: 'benchy.gcode',
          size: 2020,
          type: 'file'
        },
        {
          description: null,
          name: 'marvin.gcode',
          size: 500,
          type: 'file'
        }
      ]
    )
  })

  it('sorts by name and by size', () => {
    expect(Filters.fileSystemSort(files, ['size', 'name'], [false], 'en-us')).to.deep.equal(
      [
        {
          description: 'the default file',
          name: 'foo.bar',
          size: 1024,
          type: 'file'
        },
        {
          description: null,
          name: 'z_idlers',
          size: 4,
          type: 'directory'
        },
        {
          description: null,
          name: 'accentues.gcode',
          size: 42,
          type: 'file'
        },
        {
          description: null,
          name: 'âccentués.gcode',
          size: 42,
          type: 'file'
        },
        {
          description: 'bar',
          name: 'bar.buz',
          size: 500,
          type: 'file'
        },
        {
          description: null,
          name: 'accents',
          size: 4,
          type: 'directory'
        },
        {
          description: null,
          name: 'marvin.gcode',
          size: 500,
          type: 'file'
        },
        {
          description: 'a test file',
          name: 'benchy.gcode',
          size: 2020,
          type: 'file'
        }
      ]
    )
  })
})
