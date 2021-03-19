import Vue from 'vue'
import VueI18n, { LocaleMessages } from 'vue-i18n'
import { LocaleInfo } from './helper'
Vue.use(VueI18n)

// variable to store messages and info for auto load locale
const messages: LocaleMessages = {}
const register: LocaleInfo[] = []

// require *.ts from locales folder
const files = require.context('./locales', false, /\.ts$/)
// try to register and load every locale found in folder
files.keys().forEach(key => {
  const info = files(key).info
  // if we have the title for the current locale we can quess other info if not supplied
  if (info instanceof LocaleInfo && info.title !== '') {
    const localeName = key.replace(/(\.\/|\.ts)/g, '')

    // if we don't have flag set to the localeName (filesystem name without extension)
    if (info.flag === '') {
      info.flag = localeName
    }
    // if we don't have language identifier set to the localeName (filesystem name without extension
    if (info.language === '') {
      info.language = localeName
    }

    register.push(info)
    // store messages on global messages obj
    messages[info.language] = files(key).default
  }
})

const i18n = new VueI18n({
  locale: 'en-US', // set locale
  fallbackLocale: 'en', // set fallback locale
  messages, // set locale messages
  silentTranslationWarn: true
})

export default i18n

export const LoadedLocalization = register
