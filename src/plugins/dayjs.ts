import _Vue from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/en'
import relativeTime from 'dayjs/plugin/relativeTime'
import isToday from 'dayjs/plugin/isToday'
import updateLocale from 'dayjs/plugin/updateLocale'
import LocalizedFormat from 'dayjs/plugin/localizedFormat'
import utc from 'dayjs/plugin/utc'
import duration from 'dayjs/plugin/duration'

// import localeData from 'dayjs/plugin/localeData'

export const DayJSPlugin = {
  install (Vue: typeof _Vue) {
    dayjs.extend(relativeTime)
    dayjs.extend(isToday)
    dayjs.extend(updateLocale)
    dayjs.extend(LocalizedFormat)
    dayjs.extend(utc)
    dayjs.extend(duration)
    dayjs.locale('en-chart', {
      relativeTime: {
        future: 'in %s',
        past: '- %s min',
        s: '- 0 min',
        m: '- 1 min',
        mm: '- %d min',
        h: 'an hour',
        hh: '%d hours',
        d: 'a day',
        dd: '%d days',
        M: 'a month',
        MM: '%d months',
        y: 'a year',
        yy: '%d years'
      }
    }) // create a copy of the en locale.

    // Globally set the locale to en, we'll use the en-chart locale specifically
    // for our chart labels.
    dayjs.locale('en')

    Vue.prototype.$dayjs = dayjs
    Vue.$dayjs = dayjs
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $dayjs: typeof dayjs
  }

  interface VueConstructor {
    $dayjs: typeof dayjs
  }
}
