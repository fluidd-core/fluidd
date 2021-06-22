import dayjs from 'dayjs'

import { Filters } from '../filters'
import { timeTravel } from '@/../tests/unit/utils'

describe('formatCounterTime', () => {
  it('Formats counters as expected', () => {
    expect(Filters.formatCounterTime(10)).toBe('0m 10s')
    expect(Filters.formatCounterTime(300)).toBe('5m 0s')
  })

  it('Includes hours if relevant', () => {
    expect(Filters.formatCounterTime(3600)).toBe('1h 0m 0s')
    expect(Filters.formatCounterTime(3600 * 48)).toBe('48h 0m 0s')
  })

  it('Handles negative numbers', () => {
    expect(Filters.formatCounterTime(-300)).toBe('-5m 0s')
    expect(Filters.formatCounterTime(-3600)).toBe('-1h 0m 0s')
  })

  it('Handles 0 gracefully', () => {
    expect(Filters.formatCounterTime(0)).toBe('0m 0s')
  })

  it('Treats invalid input as 0', () => {
    expect(Filters.formatCounterTime(NaN)).toBe('0m 0s')
    expect(Filters.formatCounterTime(Infinity)).toBe('0m 0s')
    expect(Filters.formatCounterTime(-Infinity)).toBe('0m 0s')
  })
})

describe('formatDateTime', () => {
  it('Formats as human readable when in near future', () => {
    const fiveMins = dayjs().add(5, 'minutes').unix()

    expect(Filters.formatDateTime(fiveMins)).toBe('in 5 minutes')
  })

  it('Formats as date in long form when in further future', () => {
    timeTravel('2020-01-01', () => {
      const twoDays = dayjs().add(2, 'days').unix()

      expect(Filters.formatDateTime(twoDays)).toBe('Jan 3, 2020 12:00 AM')
    })
  })

  it('Lets you optionally specify a custom format', () => {
    timeTravel('2020-01-01', () => {
      const twoDays = dayjs().add(2, 'days').unix()

      expect(Filters.formatDateTime(twoDays, 'YYYY-MM-DD')).toBe('2020-01-03')
    })
  })
})
