import Vue from 'vue'
import VueI18n, { LocaleMessages } from 'vue-i18n'
import { LocaleInfo } from './helper'
Vue.use(VueI18n)

const files = require.context('./locales', false, /\.ts$/)
const messages: LocaleMessages = {}
const register: LocaleInfo[] = []

files.keys().forEach(key => {
  messages[key.replace(/(\.\/|\.ts)/g, '')] = files(key).default
  register.push(files(key).info)
})

const i18n = new VueI18n({
  locale: 'en-US', // set locale
  fallbackLocale: 'en', // set fallback locale
  messages // set locale messages
})

export default i18n

export const LoadedLocalization = register
