import { DateFormats, TimeFormats, type DateTimeFormat } from '@/globals'
import { getAllLocales } from '@/plugins/i18n'

type GetDefaultDateTimeFormatFunction = () => string

const dateTimeFormatters = (getDefaultDateFormat: GetDefaultDateTimeFormatFunction, getDefaultTimeFormat: GetDefaultDateTimeFormatFunction) => {
  const instance = {
    getDateFormat: (override?: string): DateTimeFormat => {
      return {
        locales: getAllLocales(),
        ...DateFormats[override ?? getDefaultDateFormat()]
      }
    },

    getTimeFormat: (override?: string): DateTimeFormat => {
      return {
        locales: getAllLocales(),
        ...TimeFormats[override ?? getDefaultTimeFormat()]
      }
    },

    isToday: (value: number | string | Date) => {
      const date = new Date(value)
      const today = new Date()

      return date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
    },

    isThisMonth: (value: number | string | Date) => {
      const date = new Date(value)
      const today = new Date()

      return date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
    },

    isThisYear: (value: number | string | Date) => {
      const date = new Date(value)
      const today = new Date()

      return date.getFullYear() === today.getFullYear()
    },

    moonrakerDateAsUnixTime: (value: string | number) => {
      if (typeof value === 'string') {
        return new Date(value).getTime() / 1000
      }

      return value
    },

    formatCounterSeconds: (seconds: number | string) => {
      seconds = +seconds
      if (isNaN(seconds) || !isFinite(seconds)) seconds = 0
      let isNeg = false
      if (seconds < 0) {
        seconds = Math.abs(seconds)
        isNeg = true
      }
      const h = Math.floor(seconds / 3600)
      const m = Math.floor(seconds % 3600 / 60)
      const s = Math.floor(seconds % 3600 % 60)

      let r = s + 's' // always show seconds
      r = m + 'm ' + r // always show minutes
      if (h > 0) r = h + 'h ' + r // only show hours if relevent

      return (isNeg) ? '-' + r : r
    },

    formatDate: (value: number | string | Date, options?: Intl.DateTimeFormatOptions) => {
      const date = new Date(value)
      const dateFormat = instance.getDateFormat()

      return date.toLocaleDateString(dateFormat.locales, {
        ...dateFormat.options,
        ...options
      })
    },

    formatTime: (value: number | string | Date, options?: Intl.DateTimeFormatOptions) => {
      const date = new Date(value)
      const timeFormat = instance.getTimeFormat()

      return date.toLocaleTimeString(timeFormat.locales, {
        ...timeFormat.options,
        ...options
      })
    },

    formatTimeWithSeconds: (value: number | string | Date, options?: Intl.DateTimeFormatOptions) => {
      return instance.formatTime(value, {
        second: '2-digit',
        ...options
      })
    },

    formatDateTime: (value: number | string | Date, options?: Intl.DateTimeFormatOptions) => {
      const timeFormat = instance.getTimeFormat()
      const dateFormat = instance.getDateFormat()

      if (timeFormat.locales !== dateFormat.locales) {
        return instance.formatDate(value, options) + ' ' + instance.formatTime(value, options)
      }

      const date = new Date(value)

      return date.toLocaleDateString(dateFormat.locales, {
        ...dateFormat.options,
        ...timeFormat.options,
        ...options
      })
    },

    formatRelativeTimeToNow (value: number | string | Date, options?: Intl.RelativeTimeFormatOptions) {
      return instance.formatRelativeTimeToDate(value, Date.now(), options)
    },

    formatRelativeTimeToDate (value: number | string | Date, value2: number | string | Date, options?: Intl.RelativeTimeFormatOptions) {
      const seconds = (+new Date(value) - +new Date(value2)) / 1000
      const absoluteSeconds = Math.abs(seconds)

      const [unit, unitValue]: [Intl.RelativeTimeFormatUnit, number] = absoluteSeconds >= 60 * 60 * 24 * 365
        ? [
            'year',
            Math.round(seconds / (60 * 60 * 24 * 365))
          ]
        : absoluteSeconds >= 60 * 60 * 24 * 30
          ? [
              'month',
              Math.round(seconds / (60 * 60 * 24 * 30))
            ]
          : absoluteSeconds >= 60 * 60 * 24
            ? [
                'day',
                Math.round(seconds / (60 * 60 * 24))
              ]
            : absoluteSeconds >= 60 * 60
              ? [
                  'hour',
                  Math.round(seconds / (60 * 60))
                ]
              : absoluteSeconds >= 60
                ? [
                    'minute',
                    Math.round(seconds / 60)
                  ]
                : [
                    'second',
                    seconds
                  ]

      return instance.formatRelativeTime(unitValue, unit, options)
    },

    formatRelativeTime (value: number, unit: Intl.RelativeTimeFormatUnit, options?: Intl.RelativeTimeFormatOptions) {
      const rtf = new Intl.RelativeTimeFormat(getAllLocales(), {
        numeric: 'auto',
        ...options
      })

      return rtf.format(value, unit)
    },

    formatAbsoluteDateTime: (value: number | string | Date, options?: Intl.RelativeTimeFormatOptions) => {
      if (instance.isToday(value)) {
        return instance.formatTime(value, options)
      }

      if (instance.isThisYear(value)) {
        return instance.formatDateTime(value, {
          year: undefined,
          ...options
        })
      }

      return instance.formatDateTime(value, options)
    },
  }

  return instance
}

export default dateTimeFormatters
