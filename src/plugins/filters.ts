import _Vue from 'vue'
import VueRouter from 'vue-router'
import { camelCase, startCase, capitalize, isFinite } from 'lodash-es'
import { ApiConfig } from '@/store/config/types'
import tinycolor from '@ctrl/tinycolor'
import { Globals, Waits } from '@/globals'

// import router from '@/router'

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
  formatCounterTime: (seconds: number) => {
    seconds = Number(seconds)
    if (isNaN(+seconds) || !isFinite(seconds)) seconds = 0
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

  /**
   * Formats a date from unixtime into a human readable
   * datetime.
   */
  formatDateTime: (datetime: number, format?: string) => {
    const date = _Vue.$dayjs(datetime * 1000)
    if (!format) {
      if (date.isToday()) {
        return date.fromNow()
      } else {
        return date.format('MMM D, YYYY h:mm A')
      }
    }
    return date.format(format)
  },

  /**
   * Formats a date from unixtime into a human readable
   * datetime with optional formats for today and
   * future datetimes
   */
  formatAbsoluteDateTime: (datetime: number, todayFormat?: string, futureFormat?: string) => {
    const date = _Vue.$dayjs(datetime * 1000)
    // Including a year doesn't make sense as that'll be clear from context (even on newyears-related edge cases)
    const defaultFormat = 'MMM D, h:mm a'
    const appropriateSpecifiedFormat = date.isToday() ? todayFormat : futureFormat

    return date.format(appropriateSpecifiedFormat || defaultFormat)
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
   * Formats a number representing mm to human readable distance.
   */
  getReadableLengthString (lengthInMm: number) {
    if (lengthInMm >= 1000) return (lengthInMm / 1000).toFixed(2) + ' m'
    if (lengthInMm > 100) return (lengthInMm / 10).toFixed(1) + ' cm'
    return lengthInMm.toFixed(1) + ' mm'
  },

  /**
   * Formats a number representing g to human readable weight.
   */
  getReadableWeightString (weightInG: number) {
    if (weightInG >= 1000) return (weightInG / 1000).toFixed(2) + ' kg'
    return weightInG.toFixed(2) + ' g'
  },

  /**
   * The filesystem sorter. This is copied from vuetify, and modified to ensure our directories
   * are always sorted to the top.
   */
  fileSystemSort (
    items: any,
    sortBy: string[],
    sortDesc: boolean[],
    locale: string
  ) {
    if (sortBy === null || !sortBy.length) return items
    const stringCollator = new Intl.Collator(locale, { sensitivity: 'accent', usage: 'sort' })
    return items.sort((a: any, b: any) => {
      if (a !== null && a.type === 'directory' && a.name === '..') return -1
      if (b !== null && b.type === 'directory' && b.name === '..') return 1

      for (let i = 0; i < sortBy.length; i++) {
        const sortKey = sortBy[i]

        let sortA = getObjectValueByPath(a, sortKey)
        let sortB = getObjectValueByPath(b, sortKey)

        if (sortDesc[i]) {
          [sortA, sortB] = [sortB, sortA]
        }

        // Check if both cannot be evaluated
        if (sortA === null && sortB === null) {
          continue
        }

        [sortA, sortB] = [sortA, sortB].map(s => (s || '').toString().toLocaleLowerCase())

        if (a.type === 'directory' || b.type === 'directory') {
          if (a.type === b.type) {
            return stringCollator.compare(sortA, sortB)
          } else {
            return 0
          }
        }

        if (sortA !== sortB) {
          if (!isNaN(sortA) && !isNaN(sortB)) return Number(sortA) - Number(sortB)
          return stringCollator.compare(sortA, sortB)
        }
      }
      return 0
    })
  },

  /**
   * Determines API urls from a base url
   */
  getApiUrls (url: string): ApiConfig {
    const _url = new URL(url)
    const wsProtocol = _url.protocol === 'https:' ? 'wss://' : 'ws://'
    const o = {
      apiUrl: `${_url.protocol}//${_url.host}`,
      socketUrl: `${wsProtocol}${_url.host}/websocket`
    }
    return o
  },

  /**
   * Tells us if a color is considered dark or light
   */
  isColorDark (color: string) {
    const t = tinycolor(color).getBrightness()
    return ((t / 255) * 100) <= 50
  },

  /**
   * Simple approach to route somewhere when we don't necessarily want
   * route matching via :to
   */
  routeTo (router: VueRouter, path: string) {
    if (router.currentRoute.fullPath !== path) router.push(path)
  }
}

export const FiltersPlugin = {
  install (Vue: typeof _Vue) {
    Vue.prototype.$filters = Filters
    Vue.prototype.$globals = Globals
    Vue.prototype.$waits = Waits
    Vue.$filters = Filters
    Vue.$globals = Globals
    Vue.$waits = Waits
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $filters: typeof Filters;
    $globals: typeof Globals;
    $waits: typeof Waits;
  }

  interface VueConstructor {
    $filters: typeof Filters;
    $globals: typeof Globals;
    $waits: typeof Waits;
  }
}
