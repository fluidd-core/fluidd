import Vue from 'vue'
import VueI18n, { type Locale } from 'vue-i18n'
import { consola } from 'consola'
import { SupportedLocales } from '@/globals'
import messages from '@/locales/en.yaml'
import { I18nLocales } from '@/dynamicImports'

Vue.use(VueI18n)

export const getNavigatorLocales = () => {
  return navigator.languages ?? [navigator.language]
}

export const getAllLocales = (): Intl.LocalesArgument => {
  return [
    i18n.locale,
    ...getNavigatorLocales()
  ]
}

/**
 * Loads the starting locale for the user.
 */
export const getStartingLocale = () => {
  for (const navigatorLocale of getNavigatorLocales()) {
    const code = navigatorLocale.replace('_', '-')
    const [language] = code.split('-')

    const supported = (
      SupportedLocales.find(locale => locale.code.toLowerCase() === code.toLowerCase()) ??
      SupportedLocales.find(locale => locale.code.toLowerCase() === language.toLowerCase())
    )

    if (supported) {
      return supported.code
    }
  }

  return import.meta.env.VUE_APP_I18N_LOCALE || 'en'
}

const i18n = new VueI18n({
  locale: getStartingLocale(),
  fallbackLocale: import.meta.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en',
  messages: {}
})

// Pre apply the en language for fallback.
i18n.setLocaleMessage('en', messages)

export const loadLocaleMessagesAsync = async (locale?: Locale | null) => {
  const resolvedLocale = locale ?? getStartingLocale()

  if (!i18n.availableLocales.includes(resolvedLocale)) {
    try {
      i18n.setLocaleMessage(resolvedLocale, await I18nLocales[resolvedLocale]())
    } catch (error) {
      consola.error(`[i18n] failed to load locale "${resolvedLocale}"`, error)

      return i18n.locale
    }
  }

  i18n.locale = resolvedLocale

  return resolvedLocale
}

loadLocaleMessagesAsync()

export default i18n
