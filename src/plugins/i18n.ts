import Vue from 'vue'
import VueI18n, { Locale } from 'vue-i18n'
import store from '@/store'
import getBrowserLocale from '@/util/get-browser-locale'

Vue.use(VueI18n)

/**
 * Loads the starting locale for the user.
 */
export const getStartingLocale = () => {
  const browserLocale = getBrowserLocale({ countryCodeOnly: true })
  const supportedLocales = store.state.config?.hostConfig.locales
  if (
    supportedLocales &&
    browserLocale &&
    supportedLocales.findIndex(locale => locale.code === browserLocale) >= 0) {
    return browserLocale
  } else {
    return process.env.VUE_APP_I18N_LOCALE || 'en'
  }
}

const startingLocale = getStartingLocale()

const i18n: VueI18n = new VueI18n({
  locale: startingLocale,
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en',
  messages: {}
})

const loadedLanguages: Locale[] = []

export const loadLocaleMessagesAsync = async (locale: Locale) => {
  // If already loaded, and currently selected.
  if (loadedLanguages.length > 0 && i18n.locale === locale) {
    return Promise.resolve(locale)
  }

  // If already loaded, but not the currently selected.
  if (loadedLanguages.includes(locale)) {
    i18n.locale = locale
    return Promise.resolve(locale)
  }

  // Not loaded
  return import(
    /* webpackChunkName: "locale-[request]" */ `@/locales/${locale}.yaml`
  )
    .then(messages => {
      i18n.setLocaleMessage(locale, messages.default)
      loadedLanguages.push(locale)
      i18n.locale = locale
      return Promise.resolve(locale)
    })
    .catch(() => {
      // If we had an issue, resolve with the currently set locale instead.
      return Promise.resolve(i18n.locale)
    })
}

loadLocaleMessagesAsync(startingLocale)

export default i18n
