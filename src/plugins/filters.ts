import type _Vue from 'vue'
import { isNavigationFailure, NavigationFailureType, type RawLocation } from 'vue-router'
import type { ApiConfig } from '@/store/config/types'
import { TinyColor } from '@ctrl/tinycolor'
import { Globals, Waits } from '@/globals'
import i18n from '@/plugins/i18n'
import type { TranslateResult } from 'vue-i18n'
import store from '@/store'
import router from '@/router'
import dateTimeFormatters from '@/util/date-time-formatters'
import stringFormatters from '@/util/string-formatters'
import isNullOrEmpty, { type NullableOrEmpty } from '@/util/is-null-or-empty'
import { consola } from 'consola'
import type { RootActions, RootGetters, RootMutations, RootState } from '@/store/types'

const Filters = {
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

  ...stringFormatters(),

  ...dateTimeFormatters(
    () => store.state.config.uiSettings.general.dateFormat,
    () => store.state.config.uiSettings.general.timeFormat
  ),
}

export const Rules = {
  required (v: unknown) {
    return !isNullOrEmpty(v) || i18n.t('app.general.simple_form.error.required')
  },

  numberValid (v: unknown) {
    return isNullOrEmpty(v) || Number.isFinite(+v) || i18n.t('app.general.simple_form.error.invalid_number')
  },

  numberGreaterThan (min: number) {
    return (v: NullableOrEmpty<number>) => isNullOrEmpty(v) || v > min || i18n.t('app.general.simple_form.error.min', { min: `> ${min}` })
  },

  numberGreaterThanOrEqual (min: number) {
    return (v: NullableOrEmpty<number>) => isNullOrEmpty(v) || v >= min || i18n.t('app.general.simple_form.error.min', { min })
  },

  numberGreaterThanOrEqualOrZero (min: number) {
    if (min === 0) {
      return Rules.numberGreaterThanOrEqual(0)
    }

    return (v: NullableOrEmpty<number>) => isNullOrEmpty(v) || +v === 0 || v >= min || i18n.t('app.general.simple_form.error.min_or_0', { min })
  },

  numberGreaterThanOrZero (min: number) {
    if (min === 0) {
      return Rules.numberGreaterThan(0)
    }

    return (v: NullableOrEmpty<number>) => isNullOrEmpty(v) || +v === 0 || v > min || i18n.t('app.general.simple_form.error.min_or_0', { min: `> ${min}` })
  },

  numberLessThan (max: number) {
    return (v: NullableOrEmpty<number>) => isNullOrEmpty(v) || v < max || i18n.t('app.general.simple_form.error.max', { max: `< ${max}` })
  },

  numberLessThanOrEqual (max: number) {
    return (v: NullableOrEmpty<number>) => isNullOrEmpty(v) || v <= max || i18n.t('app.general.simple_form.error.max', { max })
  },

  numberLessThanOrEqualOrZero (max: number) {
    return (v: NullableOrEmpty<number>) => isNullOrEmpty(v) || +v === 0 || v <= max || i18n.t('app.general.simple_form.error.max', { max })
  },

  numberLessThanOrZero (max: number) {
    return (v: NullableOrEmpty<number>) => isNullOrEmpty(v) || +v === 0 || v < max || i18n.t('app.general.simple_form.error.max', { max })
  },

  lengthGreaterThanOrEqual (min: number) {
    return (v: NullableOrEmpty<string | unknown[]>) => isNullOrEmpty(v) || v.length >= min || i18n.t('app.general.simple_form.error.min', { min })
  },

  lengthLessThanOrEqual (max: number) {
    return (v: NullableOrEmpty<string | unknown[]>) => isNullOrEmpty(v) || v.length <= max || i18n.t('app.general.simple_form.error.max', { max })
  },

  numberArrayValid (v: NullableOrEmpty<unknown[]>) {
    return isNullOrEmpty(v) || v.every(i => !isNullOrEmpty(i) && Number.isFinite(+i)) || i18n.t('app.general.simple_form.error.arrayofnums')
  },

  numberArrayGreaterThan (min: number) {
    return (v: NullableOrEmpty<number[]>) => isNullOrEmpty(v) || v.every(i => !isNullOrEmpty(i) && i > min) || i18n.t('app.general.simple_form.error.min', { min: `> ${min}` })
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

    Vue.prototype.$typedCommit = function (...params: any[]) {
      return this.$store.commit(...params)
    }

    Vue.prototype.$typedDispatch = function (...params: any[]) {
      return this.$store.dispatch(...params)
    }

    Object.defineProperty(Vue.prototype, '$typedState', {
      get (): RootState {
        return this.$store.state as RootState
      },
      enumerable: true
    })

    Object.defineProperty(Vue.prototype, '$typedGetters', {
      get (): RootGetters {
        return this.$store.getters as RootGetters
      },
      enumerable: true
    })
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $filters: typeof Filters;
    $rules: typeof Rules;
    $globals: typeof Globals;
    $waits: typeof Waits;
    $typedState: RootState;
    $typedGetters: RootGetters;
    $typedCommit: RootMutations;
    $typedDispatch: RootActions;
  }

  interface VueConstructor {
    $filters: typeof Filters;
    $rules: typeof Rules;
    $globals: typeof Globals;
    $waits: typeof Waits;
    $typedState: RootState;
    $typedGetters: RootGetters;
    $typedCommit: RootMutations;
    $typedDispatch: RootActions;
  }
}
