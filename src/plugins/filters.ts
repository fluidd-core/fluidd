import _Vue from 'vue'
import VueRouter from 'vue-router'
import { camelCase, startCase, capitalize, isFinite, upperFirst } from 'lodash-es'
import type { ApiConfig, TextSortOrder } from '@/store/config/types'
import { TinyColor } from '@ctrl/tinycolor'
import { DateFormats, Globals, TimeFormats, Waits, type DateTimeFormat } from '@/globals'
import i18n from '@/plugins/i18n'
import type { TranslateResult } from 'vue-i18n'
import store from '@/store'
import type { FileBrowserEntry } from '@/store/files/types'
import versionStringCompare from '@/util/version-string-compare'

/**
 * credit: taken from Vuetify source
 */
const getNestedValue = (obj: any, path: (string | number)[], fallback?: any): any => {
  const last = path.length - 1

  if (last < 0) return obj === undefined ? fallback : obj

  for (let i = 0; i < last; i++) {
    if (obj == null) {
      return fallback
    }
    obj = obj[path[i]]
  }

  if (obj == null) return fallback

  return obj[path[last]] === undefined ? fallback : obj[path[last]]
}

/**
 * credit: taken from Vuetify source
 */
const getObjectValueByPath = (obj: any, path: string, fallback?: any): any => {
  // credit: http://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key#comment55278413_6491621
  if (obj == null || !path || typeof path !== 'string') return fallback
  if (obj[path] !== undefined) return obj[path]
  path = path.replace(/\[(\w+)\]/g, '.$1') // convert indexes to properties
  path = path.replace(/^\./, '') // strip a leading dot
  return getNestedValue(obj, path.split('.'), fallback)
}

export const Filters = {

  /**
   * Formats a time to 00h 00m 00s
   * Expects to be passed seconds.
   */
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

  getNavigatorLocales: () => {
    return navigator.languages ?? [navigator.language]
  },

  getAllLocales: () => {
    return [
      i18n.locale,
      ...Filters.getNavigatorLocales()
    ]
  },

  getDateFormat: (override?: string): DateTimeFormat => {
    return {
      locales: Filters.getAllLocales(),
      ...DateFormats[override ?? store.state.config.uiSettings.general.dateFormat]
    }
  },

  getTimeFormat: (override?: string): DateTimeFormat => {
    return {
      locales: Filters.getAllLocales(),
      ...TimeFormats[override ?? store.state.config.uiSettings.general.timeFormat]
    }
  },

  formatDate: (value: number | string | Date, options?: Intl.DateTimeFormatOptions) => {
    const date = new Date(value)
    const dateFormat = Filters.getDateFormat()

    return date.toLocaleDateString(dateFormat.locales, {
      ...dateFormat.options,
      ...options
    })
  },

  formatTime: (value: number | string | Date, options?: Intl.DateTimeFormatOptions) => {
    const date = new Date(value)
    const timeFormat = Filters.getTimeFormat()

    return date.toLocaleTimeString(timeFormat.locales, {
      ...timeFormat.options,
      ...options
    })
  },

  formatTimeWithSeconds: (value: number | string | Date, options?: Intl.DateTimeFormatOptions) => {
    return Filters.formatTime(value, {
      second: '2-digit',
      ...options
    })
  },

  formatDateTime: (value: number | string | Date, options?: Intl.DateTimeFormatOptions) => {
    const timeFormat = Filters.getTimeFormat()
    const dateFormat = Filters.getDateFormat()

    if (timeFormat.locales !== dateFormat.locales) {
      return Filters.formatDate(value, options) + ' ' + Filters.formatTime(value, options)
    }

    const date = new Date(value)

    return date.toLocaleDateString(dateFormat.locales, {
      ...dateFormat.options,
      ...timeFormat.options,
      ...options
    })
  },

  formatRelativeTimeToNow (value: number | string | Date, options?: Intl.RelativeTimeFormatOptions) {
    return Filters.formatRelativeTimeToDate(value, Date.now(), options)
  },

  formatRelativeTimeToDate (value: number | string | Date, value2: number | string | Date, options?: Intl.RelativeTimeFormatOptions) {
    let v = Math.floor(+new Date(value) / 1000)
    let v2 = Math.floor(+new Date(value2) / 1000)

    const units: { unit: Intl.RelativeTimeFormatUnit, limit: number }[] = [
      { unit: 'second', limit: 60 },
      { unit: 'minute', limit: 60 },
      { unit: 'hour', limit: 24 },
      { unit: 'day', limit: 30 },
      { unit: 'month', limit: 12 },
      { unit: 'year', limit: -1 }
    ]

    for (const { unit, limit } of units) {
      if (limit === -1 || Math.abs(v - v2) < limit) {
        return Filters.formatRelativeTime(v - v2, unit, options)
      }

      v = Math.floor(v / limit)
      v2 = Math.floor(v2 / limit)
    }
  },

  formatRelativeTime (value: number, unit: Intl.RelativeTimeFormatUnit, options?: Intl.RelativeTimeFormatOptions) {
    const rtf = new Intl.RelativeTimeFormat(Filters.getAllLocales(), {
      numeric: 'auto',
      ...options
    })

    return rtf.format(value, unit)
  },

  formatAbsoluteDateTime: (value: number | string | Date, options?: Intl.RelativeTimeFormatOptions) => {
    if (Filters.isToday(value)) {
      return Filters.formatTime(value, options)
    }

    if (Filters.isThisYear(value)) {
      return Filters.formatDateTime(value, {
        year: undefined,
        ...options
      })
    }

    return Filters.formatDateTime(value, options)
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

  upperFirst: (value: string) => {
    return upperFirst(value)
  },

  prettyCase: (value: string) => {
    return value
      .replace(/_/g, ' ')
      .split(' ')
      .filter(x => x)
      .map(Filters.upperFirst)
      .join(' ')
  },

  /**
   * Formats a string into camel case.
   */
  camelCase: (string: string) => {
    return camelCase(string)
  },

  /**
   * Formats a string into start case.
   */
  startCase: (string: string) => {
    return startCase(string)
  },

  /**
   * Converts the first character to upper case and the rest lower case, removing underscores.
   * TEST_STRING -> Teststring
   */
  capitalize: (string: string) => {
    string = Filters.camelCase(string)
    return capitalize(string)
  },

  /**
   * Formats a number (in bytes) to a human readable file size.
   */
  getReadableFileSizeString (fileSizeInBytes: number) {
    let i = -1
    const byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB']
    if (fileSizeInBytes === 0) return `0${byteUnits[0]}`
    do {
      fileSizeInBytes = fileSizeInBytes / 1024
      i++
    } while (fileSizeInBytes > 1024)

    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i]
  },

  /**
   * Formats a number (in bytes/sec) to a human readable data rate.
   */
  getReadableDataRateString (dataRateInBytesPerSec: number) {
    let i = -1
    const byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB']
    if (dataRateInBytesPerSec === 0) return `0${byteUnits[0]}`
    do {
      dataRateInBytesPerSec = dataRateInBytesPerSec / 1024
      i++
    } while (dataRateInBytesPerSec > 1024)

    return Math.max(dataRateInBytesPerSec, 0.2).toFixed(1) + byteUnits[i] + '/Sec'
  },

  /**
   * Formats a number representing mm to human readable distance.
   */
  getReadableLengthString (lengthInMm: number | undefined | null, showMicrons = false) {
    if (lengthInMm === undefined || lengthInMm === null) {
      return '-'
    }

    if (lengthInMm >= 1000) return (lengthInMm / 1000).toFixed(2) + ' m'
    if (lengthInMm > 100) return (lengthInMm / 10).toFixed(1) + ' cm'
    if (lengthInMm < 0.1 && showMicrons) return (lengthInMm * 1000).toFixed(0) + ' μm'
    return lengthInMm.toFixed(1) + ' mm'
  },

  /**
   * Formats a number representing g to human readable weight.
   */
  getReadableWeightString (weightInG: number | undefined | null) {
    if (weightInG === undefined || weightInG === null) {
      return '-'
    }

    if (weightInG >= 1000) return (weightInG / 1000).toFixed(2) + ' kg'
    return weightInG.toFixed(2) + ' g'
  },

  /**
   * Formats a number (in Hz) to a human readable frequency.
   */
  getReadableFrequencyString (frequencyInHz: number) {
    let i = 0
    const frequencyUnits = [' Hz', ' kHz', ' MHz', ' GHz', ' THz']
    while (frequencyInHz >= 1000) {
      frequencyInHz = frequencyInHz / 1000
      i++
    }
    return frequencyInHz.toFixed() + frequencyUnits[i]
  },

  /**
   * Formats a number (in ohms) to a human readable resistance.
   */
  getReadableResistanceString (resistanceInOhms: number) {
    let i = 0
    const resistanceUnits = [' Ω', ' kΩ', ' MΩ', ' GΩ', ' TΩ']
    while (resistanceInOhms >= 1000) {
      resistanceInOhms = resistanceInOhms / 1000
      i++
    }
    return resistanceInOhms.toFixed(1) + resistanceUnits[i]
  },

  /**
   * Formats a number (in hPa) to human readable atmospheric pressure.
   */
  getReadableAtmosphericPressureString (pressumeInHPa: number) {
    return pressumeInHPa.toFixed(1) + ' hPa'
  },

  /**
   * The filesystem sorter. This is copied from vuetify, and modified to ensure our directories
   * are always sorted to the top.
   */
  fileSystemSort (
    items: FileBrowserEntry[],
    sortBy: string[],
    sortDesc: boolean[],
    locale: string,
    textSortOrder: TextSortOrder
  ) {
    if (sortBy === null || !sortBy.length) return items
    const stringCollator = new Intl.Collator(locale, { sensitivity: 'accent', usage: 'sort' })
    return items.sort((a, b) => {
      if (a.type === 'directory' && (a.dirname === '..' || b.type !== 'directory')) return -1
      if (b.type === 'directory' && (b.dirname === '..' || a.type !== 'directory')) return 1

      for (let i = 0; i < sortBy.length; i++) {
        const sortKey = sortBy[i]

        const sortValues = [
          getObjectValueByPath(a, sortKey),
          getObjectValueByPath(b, sortKey)
        ]

        // If values are equal, continue
        if (sortValues[0] === sortValues[1]) {
          continue
        }

        // If sorting descending, reverse values
        if (sortDesc[i]) {
          sortValues.reverse()
        }

        // If values are of type number, compare as number
        if (sortValues.every(x => typeof (x) === 'number' && !isNaN(x))) {
          return sortValues[0] - sortValues[1]
        }

        const sortValuesAsString = sortValues
          .map(s => (s || '').toString() as string)

        if (textSortOrder === 'numeric-prefix') {
          const [sortA, sortB] = sortValuesAsString
            .map(s => s.match(/^\d+/))

          // If are number prefixed, compare prefixes as number
          if (sortA && sortB && sortA[0] !== sortB[0]) {
            return +sortA[0] - +sortB[0]
          }
        } else if (textSortOrder === 'version') {
          return versionStringCompare(sortValuesAsString[0], sortValuesAsString[1])
        }

        return stringCollator.compare(sortValuesAsString[0], sortValuesAsString[1])
      }
      return 0
    })
  },

  /**
   * Determines API urls from a base url
   */
  getApiUrls (apiUrl: string): ApiConfig {
    if (
      !apiUrl.startsWith('http://') &&
      !apiUrl.startsWith('https://')
    ) {
      apiUrl = `http://${apiUrl}`
    }

    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1)
    }

    const socketUrl = new URL(apiUrl)

    socketUrl.protocol = socketUrl.protocol === 'https:'
      ? 'wss://'
      : 'ws://'
    socketUrl.pathname += socketUrl.pathname.endsWith('/')
      ? 'websocket'
      : '/websocket'

    return {
      apiUrl,
      socketUrl: socketUrl.toString()
    }
  },

  /**
   * Tells us if a color is considered dark or light
   */
  isColorDark (color: string) {
    const t = new TinyColor(color).getBrightness()
    return ((t / 255) * 100) <= 50
  },

  /**
   * Simple approach to route somewhere when we don't necessarily want
   * route matching via :to
   */
  routeTo (router: VueRouter, path: string) {
    if (router.currentRoute.fullPath !== path) router.push(path)
  },

  /**
   * Converts a given weight (in grams) to its corresponding length (in mm)
   */
  convertFilamentWeightToLength (weight: number, density: number, diameter: number) {
    // l[mm] = m[g]/D[g/cm³]/A[mm²]*(1000mm³/cm³)
    return weight / density / (Math.PI * (diameter / 2) ** 2) * 1000
  }
}

export const Rules = {
  required (v: unknown) {
    return ((v ?? '') !== '') || i18n.t('app.general.simple_form.error.required')
  },

  numberValid (v: unknown) {
    return !isNaN(+(v ?? NaN)) || i18n.t('app.general.simple_form.error.invalid_number')
  },

  numberGreaterThan (min: number) {
    return (v: number) => v > min || i18n.t('app.general.simple_form.error.min', { min: `> ${min}` })
  },

  numberGreaterThanOrEqual (min: number) {
    return (v: number) => v >= min || i18n.t('app.general.simple_form.error.min', { min })
  },

  numberGreaterThanOrEqualOrZero (min: number) {
    if (min === 0) {
      return Rules.numberGreaterThanOrEqual(0)
    }

    return (v: number) => +v === 0 || v >= min || i18n.t('app.general.simple_form.error.min_or_0', { min })
  },

  numberGreaterThanOrZero (min: number) {
    if (min === 0) {
      return Rules.numberGreaterThan(0)
    }

    return (v: number) => +v === 0 || v > min || i18n.t('app.general.simple_form.error.min_or_0', { min: `> ${min}` })
  },

  numberLessThan (max: number) {
    return (v: number) => v < max || i18n.t('app.general.simple_form.error.max', { max: `< ${max}` })
  },

  numberLessThanOrEqual (max: number) {
    return (v: number) => v <= max || i18n.t('app.general.simple_form.error.max', { max })
  },

  numberLessThanOrEqualOrZero (max: number) {
    return (v: number) => +v === 0 || v <= max || i18n.t('app.general.simple_form.error.max', { max })
  },

  numberLessThanOrZero (max: number) {
    return (v: number) => +v === 0 || v < max || i18n.t('app.general.simple_form.error.max', { max })
  },

  lengthGreaterThanOrEqual (min: number) {
    return (v: string | unknown[]) => v.length >= min || i18n.t('app.general.simple_form.error.min', { min })
  },

  lengthLessThanOrEqual (max: number) {
    return (v: string | unknown[]) => v.length <= max || i18n.t('app.general.simple_form.error.max', { max })
  },

  numberArrayValid (v: unknown[]) {
    return !v.some(i => i === '' || isNaN(+(i ?? NaN))) || i18n.t('app.general.simple_form.error.arrayofnums')
  },

  passwordNotEqualUsername (username?: string | null) {
    return (v: string) => (v.toLowerCase() !== (username ?? '').toLowerCase()) || i18n.t('app.general.simple_form.error.password_username')
  },

  aspectRatioValid (v: string) {
    return /^\d+\s*[:/]\s*\d+$/.test(v) || i18n.t('app.general.simple_form.error.invalid_aspect')
  },

  regExpPatternValid (v: string) {
    try {
      // eslint-disable-next-line no-new
      new RegExp(v)
      return true
    } catch (e) {
      return i18n.t('app.general.simple_form.error.invalid_expression')
    }
  },

  regExpValid (regExp: RegExp, errorMessage: string | TranslateResult) {
    return (v: string) => regExp.test(v) || errorMessage || 'Invalid'
  }
}

export const FiltersPlugin = {
  install (Vue: typeof _Vue) {
    Vue.prototype.$filters = Filters
    Vue.prototype.$rules = Rules
    Vue.prototype.$globals = Globals
    Vue.prototype.$waits = Waits
    Vue.$filters = Filters
    Vue.$rules = Rules
    Vue.$globals = Globals
    Vue.$waits = Waits
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $filters: typeof Filters;
    $rules: typeof Rules;
    $globals: typeof Globals;
    $waits: typeof Waits;
  }

  interface VueConstructor {
    $filters: typeof Filters;
    $rules: typeof Rules;
    $globals: typeof Globals;
    $waits: typeof Waits;
  }
}
