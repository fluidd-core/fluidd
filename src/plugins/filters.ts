import _Vue from 'vue'
import { camelCase, startCase, capitalize, isFinite } from 'lodash-es'
import { ApiConfig } from '@/store/config/types'

const Filters = {

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
   * Formats a date in string format into a human readable
   * datetime.
   */
  formatFileDateTime: (datetime: number) => {
    const date = _Vue.$dayjs(datetime * 1000)
    if (date.isToday()) {
      return date.fromNow()
    } else {
      return date.format('MMM D, YYYY h:mm A')
    }
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
   * The filesystem sorter. This is copied from vuetify, and modified to ensure our directories
   * are always sorted to the top.
   */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  fileSystemSort (items: any, sortBy: string[], sortDesc: boolean[], locale: string) {
    if (sortBy === null || !sortBy.length) return items
    const stringCollator = new Intl.Collator(locale, { sensitivity: 'accent', usage: 'sort' })
    items.sort((a: any, b: any) => {
      for (let i = 0; i < sortBy.length; i++) {
        const sortKey = sortBy[i]

        let sortA = a[sortKey]
        let sortB = b[sortKey]

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
    return items
  },

  /**
   * Determines API urls from a base url
   */
  getApiUrls (url: string) {
    const _url = new URL(url)
    const wsProtocol = _url.protocol === 'https:' ? 'wss://' : 'ws://'
    return {
      apiUrl: `${_url.protocol}${_url.host}`,
      socketUrl: `${wsProtocol}${_url.host}/websocket`
    }
  }

  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export const FiltersPlugin = {
  install (Vue: typeof _Vue) {
    Vue.prototype.$filters = Filters
    Vue.$filters = Filters
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $filters: Filters;
  }

  interface VueConstructor {
    $filters: Filters;
  }

  interface Filters {
    formatCounterTime(seconds: number): string;
    camelCase(string: string): string;
    startCase(string: string): string;
    capitalize(string: string): string;
    formatFileDateTime(datetime: number): string;
    getReadableFileSizeString(fileSizeInBytes: number): string;
    getReadableLengthString(lengthInMm: number): string;
    getApiUrls(url: string): ApiConfig;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    fileSystemSort(items: Array<any>, sortBy: string[], sortDesc: boolean[], locale: string): Array<any>;
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }
}
