import type _Vue from 'vue'
import { isNavigationFailure, NavigationFailureType, type RawLocation } from 'vue-router'
import { upperFirst } from 'lodash-es'
import type { ApiConfig } from '@/store/config/types'
import { TinyColor } from '@ctrl/tinycolor'
import { Globals, Waits } from '@/globals'
import i18n from '@/plugins/i18n'
import type { TranslateResult } from 'vue-i18n'
import store from '@/store'
import router from '@/router'
import dateTimeFormatter from '@/util/date-time-formatter'
import consola from 'consola'

const Filters = {
  getNavigatorLocales: () => {
    return navigator.languages ?? [navigator.language]
  },

  getAllLocales: (): Intl.LocalesArgument => {
    return [
      i18n.locale,
      ...Filters.getNavigatorLocales()
    ]
  },

  prettyCase: (value: string) => {
    return value
      .split(/[ _]/g)
      .filter(x => x)
      .map(upperFirst)
      .join(' ')
  },

  /**
   * Formats a number (in bytes) to a human readable file size.
   */
  getReadableFileSizeString (fileSizeInBytes: number, fractionDigits = 1) {
    let i = -1
    const byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB']
    if (fileSizeInBytes === 0) return `0${byteUnits[0]}`
    do {
      fileSizeInBytes = fileSizeInBytes / 1024
      i++
    } while (fileSizeInBytes > 1024)

    return Math.max(fileSizeInBytes, 0.1).toFixed(fractionDigits) + byteUnits[i]
  },

  /**
   * Formats a number (in bytes/sec) to a human readable data rate.
   */
  getReadableDataRateString (dataRateInBytesPerSec: number, fractionDigits = 1) {
    let i = -1
    const byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB']
    if (dataRateInBytesPerSec === 0) return `0${byteUnits[0]}`
    do {
      dataRateInBytesPerSec = dataRateInBytesPerSec / 1024
      i++
    } while (dataRateInBytesPerSec > 1024)

    return Math.max(dataRateInBytesPerSec, 0.2).toFixed(fractionDigits) + byteUnits[i] + '/Sec'
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
  getReadableWeightString (weightInG: number | undefined | null, fractionDigits = 2) {
    if (weightInG === undefined || weightInG === null) {
      return '-'
    }

    if (weightInG >= 1000) return (weightInG / 1000).toFixed(fractionDigits) + ' kg'
    return weightInG.toFixed(fractionDigits) + ' g'
  },

  /**
   * Formats a number (in Hz) to a human readable frequency.
   */
  getReadableFrequencyString (frequencyInHz: number, fractionDigits = 0) {
    let i = 0
    const frequencyUnits = [' Hz', ' kHz', ' MHz', ' GHz', ' THz']
    while (frequencyInHz >= 1000) {
      frequencyInHz = frequencyInHz / 1000
      i++
    }
    return frequencyInHz.toFixed(fractionDigits) + frequencyUnits[i]
  },

  /**
   * Formats a number (in ohms) to a human readable resistance.
   */
  getReadableResistanceString (resistanceInOhms: number, fractionDigits = 1) {
    let i = 0
    const resistanceUnits = [' Ω', ' kΩ', ' MΩ', ' GΩ', ' TΩ']
    while (resistanceInOhms >= 1000) {
      resistanceInOhms = resistanceInOhms / 1000
      i++
    }
    return resistanceInOhms.toFixed(fractionDigits) + resistanceUnits[i]
  },

  /**
   * Formats a number (in hPa) to human readable atmospheric pressure.
   */
  getReadableAtmosphericPressureString (pressumeInHPa: number, fractionDigits = 1) {
    return pressumeInHPa.toFixed(fractionDigits) + ' hPa'
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
  async routeTo (to: RawLocation) {
    try {
      await router.push(to)
    } catch (error) {
      // Ignore any duplicate navigation error but log the others
      if (!isNavigationFailure(error, NavigationFailureType.duplicated)) {
        consola.error('[Router]', error)
      }
    }
  },

  /**
   * Converts a given weight (in grams) to its corresponding length (in mm)
   */
  convertFilamentWeightToLength (weight: number, density: number, diameter: number) {
    // l[mm] = m[g]/D[g/cm³]/A[mm²]*(1000mm³/cm³)
    return weight / density / (Math.PI * (diameter / 2) ** 2) * 1000
  },

  ...dateTimeFormatter(
    (): Intl.LocalesArgument => Filters.getAllLocales(),
    () => store.state.config.uiSettings.general.dateFormat,
    () => store.state.config.uiSettings.general.timeFormat
  )
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
    } catch {
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
