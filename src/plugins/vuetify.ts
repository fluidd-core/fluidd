import { Icons } from '@/globals'
import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import { Ripple } from 'vuetify/lib/directives'
import colors from 'vuetify/lib/util/colors'
import type { VuetifyLocale } from 'vuetify/types/services/lang'

// Vuetify's own component translations, keyed by Fluidd locale code.
// Codes absent here (ie, `ta`) have no Vuetify translation and stay english.
const locales: Record<string, () => Promise<{ default: VuetifyLocale }>> = {
  af: () => import('vuetify/lib/locale/af'),
  ar: () => import('vuetify/lib/locale/ar'),
  cs: () => import('vuetify/lib/locale/cs'),
  de: () => import('vuetify/lib/locale/de'),
  en: () => import('vuetify/lib/locale/en'),
  es: () => import('vuetify/lib/locale/es'),
  fr: () => import('vuetify/lib/locale/fr'),
  hu: () => import('vuetify/lib/locale/hu'),
  it: () => import('vuetify/lib/locale/it'),
  ja: () => import('vuetify/lib/locale/ja'),
  ko: () => import('vuetify/lib/locale/ko'),
  nl: () => import('vuetify/lib/locale/nl'),
  pl: () => import('vuetify/lib/locale/pl'),
  pt: () => import('vuetify/lib/locale/pt'),
  pt_BR: () => import('vuetify/lib/locale/pt'),
  ru: () => import('vuetify/lib/locale/ru'),
  sl: () => import('vuetify/lib/locale/sl'),
  sv: () => import('vuetify/lib/locale/sv'),
  th: () => import('vuetify/lib/locale/th'),
  tr: () => import('vuetify/lib/locale/tr'),
  uk: () => import('vuetify/lib/locale/uk'),
  'zh-CN': () => import('vuetify/lib/locale/zh-Hans'),
  'zh-HK': () => import('vuetify/lib/locale/zh-Hant')
}

Vue.use(Vuetify, {
  directives: { Ripple }
})

const vuetify = new Vuetify({
  breakpoint: {
    mobileBreakpoint: 'xs'
  },
  icons: {
    iconfont: 'mdiSvg',
    values: Icons
  },
  theme: {
    dark: true,
    options: {
      customProperties: true
    },
    themes: {
      dark: {
        primary: '#2196F3',
        'primary-offset': '#2E75AE',
        secondary: '#888888', // colors.grey.darken1,
        'card-heading': '#333337',
        btncolor: '#4A4A4F',
        drawer: '#28282B',
        appbar: '#1E1E20',
        logo: '#2196F3'
      },
      light: {
        primary: '#2196F3',
        'primary-offset': '#2E75AE',
        secondary: colors.grey.lighten1,
        'card-heading': '#E9E9E9',
        btncolor: '#E9E9E9',
        drawer: '#F4F4F4',
        appbar: '#FFFFFF',
        logo: '#2196F3'
      }
    }
  }
})

/**
 * Loads and applies the Vuetify component translations for a given locale.
 */
export const loadVuetifyLocaleAsync = async (locale: string) => {
  const { lang } = vuetify.framework

  const load = locales[locale]

  if (!load) {
    return
  }

  if (!(locale in lang.locales)) {
    const { default: messages } = await load()

    Vue.set(lang.locales, locale, messages)
  }

  lang.current = locale
}

export default vuetify
