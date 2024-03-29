import { Filters } from '../filters'
import { timeTravel } from '@/../tests/unit/utils'

describe('formatCounterSeconds', () => {
  it('Formats counters as expected', () => {
    expect(Filters.formatCounterSeconds(10)).toBe('0m 10s')
    expect(Filters.formatCounterSeconds(300)).toBe('5m 0s')
  })

  it('Includes hours if relevant', () => {
    expect(Filters.formatCounterSeconds(3600)).toBe('1h 0m 0s')
    expect(Filters.formatCounterSeconds(3600 * 48)).toBe('48h 0m 0s')
  })

  it('Handles negative numbers', () => {
    expect(Filters.formatCounterSeconds(-300)).toBe('-5m 0s')
    expect(Filters.formatCounterSeconds(-3600)).toBe('-1h 0m 0s')
  })

  it('Handles 0 gracefully', () => {
    expect(Filters.formatCounterSeconds(0)).toBe('0m 0s')
  })

  it('Treats invalid input as 0', () => {
    expect(Filters.formatCounterSeconds(NaN)).toBe('0m 0s')
    expect(Filters.formatCounterSeconds(Infinity)).toBe('0m 0s')
    expect(Filters.formatCounterSeconds(-Infinity)).toBe('0m 0s')
  })
})

describe('formatDateTime', () => {
  it('Formats as human readable when in future', () => {
    const fiveMins = Date.now() + (5 * 60 * 1000)

    expect(Filters.formatRelativeTimeToNow(fiveMins)).toBe('in 5 minutes')

    const oneDay = Date.now() + (24 * 60 * 60 * 1000)

    expect(Filters.formatRelativeTimeToNow(oneDay)).toBe('tomorrow')
  })

  it('Formats as human readable when in past', () => {
    timeTravel('2022-11-19 14:32', () => {
      const fiveMins = Date.now() - (5 * 60 * 1000)

      expect(Filters.formatRelativeTimeToNow(fiveMins)).toBe('5 minutes ago')

      const oneDay = Date.now() - (24 * 60 * 60 * 1000)

      expect(Filters.formatRelativeTimeToNow(oneDay)).toBe('yesterday')

      const date = new Date(2022, 10, 16, 15, 9)

      expect(Filters.formatRelativeTimeToDate(date, new Date())).toBe('3 days ago')
    })
  })

  it('Formats as ISO8601 correctly', () => {
    timeTravel('2022-11-19 14:32', () => {
      const now = Date.now()

      expect(Filters.formatAbsoluteDateTime(now)).toBe('14:32')

      const fiveMins = Date.now() + (5 * 60 * 1000)

      expect(Filters.formatAbsoluteDateTime(fiveMins)).toBe('14:37')

      const tenHours = Date.now() + (10 * 60 * 60 * 1000)

      expect(Filters.formatAbsoluteDateTime(tenHours)).toBe('11-20 00:32')

      const oneYear = Date.now() + (365 * 24 * 60 * 60 * 1000)

      expect(Filters.formatAbsoluteDateTime(oneYear)).toBe('2023-11-19 14:32')
    })
  })
})
