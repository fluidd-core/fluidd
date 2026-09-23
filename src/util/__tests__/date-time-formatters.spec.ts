import dateTimeFormatters from '../date-time-formatters'
import { timeTravel } from '@/../tests/unit/utils'

const buildTestDateTimeFormatters = (dateFormatName: string = '', timeFormatName: string = '') => dateTimeFormatters(
  () => dateFormatName,
  () => timeFormatName
)

describe('formatCounterSeconds', () => {
  const dtf = buildTestDateTimeFormatters()

  it('Formats counters as expected', () => {
    expect(dtf.formatCounterSeconds(10)).toBe('0m 10s')
    expect(dtf.formatCounterSeconds(300)).toBe('5m 0s')
  })

  it('Includes hours if relevant', () => {
    expect(dtf.formatCounterSeconds(3600)).toBe('1h 0m 0s')
    expect(dtf.formatCounterSeconds(3600 * 48)).toBe('48h 0m 0s')
  })

  it('Handles negative numbers', () => {
    expect(dtf.formatCounterSeconds(-300)).toBe('-5m 0s')
    expect(dtf.formatCounterSeconds(-3600)).toBe('-1h 0m 0s')
  })

  it('Handles 0 gracefully', () => {
    expect(dtf.formatCounterSeconds(0)).toBe('0m 0s')
  })

  it('Treats invalid input as 0', () => {
    expect(dtf.formatCounterSeconds(NaN)).toBe('0m 0s')
    expect(dtf.formatCounterSeconds(Number.POSITIVE_INFINITY)).toBe('0m 0s')
    expect(dtf.formatCounterSeconds(Number.NEGATIVE_INFINITY)).toBe('0m 0s')
  })
})

describe('formatDate and formatTime', () => {
  const dtf = buildTestDateTimeFormatters('iso', 'iso')

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Builds a formatter once per distinct format', () => {
    const date = new Date(2022, 10, 19, 14, 32)
    const dateTimeFormatSpy = vi.spyOn(Intl, 'DateTimeFormat')

    const first = dtf.formatDate(date, { era: 'short' })

    expect(dtf.formatDate(date, { era: 'short' })).toBe(first)
    expect(dateTimeFormatSpy).toHaveBeenCalledTimes(1)
  })

  it('Builds a relative time formatter once per distinct format', () => {
    const relativeTimeFormatSpy = vi.spyOn(Intl, 'RelativeTimeFormat')

    const first = dtf.formatRelativeTime(3, 'day', { numeric: 'always', style: 'narrow' })

    expect(dtf.formatRelativeTime(3, 'day', { numeric: 'always', style: 'narrow' })).toBe(first)
    expect(relativeTimeFormatSpy).toHaveBeenCalledTimes(1)
  })

  it('Keeps distinct formats apart', () => {
    const date = new Date(2022, 10, 19, 14, 32, 45)

    expect(dtf.formatTime(date, { second: '2-digit' })).not.toBe(dtf.formatTime(date))
  })

  it('Renders invalid dates as Invalid Date', () => {
    expect(dtf.formatDate(NaN)).toBe('Invalid Date')
    expect(dtf.formatTime(NaN)).toBe('Invalid Date')
    expect(dtf.formatDateTime(NaN)).toBe('Invalid Date')
  })
})

describe('formatDateTime', () => {
  it('Formats as human readable when in future', () => {
    timeTravel('2022-11-19 14:32', () => {
      const dtf = buildTestDateTimeFormatters()

      const fiveMins = Date.now() + (5 * 60 * 1000)

      expect(dtf.formatRelativeTimeToNow(fiveMins)).toBe('in 5 minutes')

      const oneDay = Date.now() + (24 * 60 * 60 * 1000)

      expect(dtf.formatRelativeTimeToNow(oneDay)).toBe('tomorrow')
    })
  })

  it('Formats as human readable when in past', () => {
    timeTravel('2022-11-19 14:32', () => {
      const dtf = buildTestDateTimeFormatters()

      const fiveMins = Date.now() - (5 * 60 * 1000)

      expect(dtf.formatRelativeTimeToNow(fiveMins)).toBe('5 minutes ago')

      const oneDay = Date.now() - (24 * 60 * 60 * 1000)

      expect(dtf.formatRelativeTimeToNow(oneDay)).toBe('yesterday')

      const date = new Date(2022, 10, 16, 15, 9)

      expect(dtf.formatRelativeTimeToDate(date, new Date())).toBe('3 days ago')
    })
  })

  it('Formats as ISO8601 correctly', () => {
    timeTravel('2022-11-19 14:32', () => {
      const dtf = buildTestDateTimeFormatters('iso', 'iso')

      const now = Date.now()

      expect(dtf.formatAbsoluteDateTime(now)).toBe('14:32')

      const fiveMins = Date.now() + (5 * 60 * 1000)

      expect(dtf.formatAbsoluteDateTime(fiveMins)).toBe('14:37')

      const tenHours = Date.now() + (10 * 60 * 60 * 1000)

      expect(dtf.formatAbsoluteDateTime(tenHours)).toBe('11-20 00:32')

      const oneYear = Date.now() + (365 * 24 * 60 * 60 * 1000)

      expect(dtf.formatAbsoluteDateTime(oneYear)).toBe('2023-11-19 14:32')
    })
  })
})
