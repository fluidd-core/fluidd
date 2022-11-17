import Vue from 'vue'
import VueI18n, { Locale } from 'vue-i18n'
import store from '@/store'
import getBrowserLocale from '@/util/get-browser-locale'
import messages from '@/locales/en.yaml'
import { I18nLocales } from '@/dynamicImports'

Vue.use(VueI18n)

/**
 * Loads the starting locale for the user.
 */
export const getStartingLocale = () => {
  const browserLocale = getBrowserLocale({ countryCodeOnly: true })
  const supportedLocales = store.state.config.hostConfig.locales
  if (
    supportedLocales &&
    browserLocale &&
    supportedLocales.findIndex(locale => locale.code === browserLocale) >= 0) {
    return browserLocale
  } else {
    return import.meta.env.VUE_APP_I18N_LOCALE || 'en'
  }
}

const startingLocale = getStartingLocale()

const i18n: VueI18n = new VueI18n({
  locale: startingLocale,
  fallbackLocale: import.meta.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en',
  messages: {}
})

// Pre apply the en language for fallback.
i18n.setLocaleMessage('en', messages)
const loadedLanguages: Locale[] = []

export const loadLocaleMessagesAsync = async (locale: Locale) => {
  // If already loaded, and currently selected.
  if (loadedLanguages.length > 0 && i18n.locale === locale) {
    return locale
  }

  // If already loaded, but not the currently selected.
  if (loadedLanguages.includes(locale)) {
    i18n.locale = locale
    return locale
  }

  // Not loaded
  try {
    const messages = await I18nLocales[locale]()

    i18n.setLocaleMessage(locale, messages)
    loadedLanguages.push(locale)
    i18n.locale = locale
    return locale
  } catch {
    return i18n.locale
  }
}

loadLocaleMessagesAsync(startingLocale)

export default i18n
