import i18n, { LoadedLocalization } from '../localization'
export class LocaleInfo {
    public flag = ''
    public language = ''
    public title = ''
    constructor ({ flag = '', language = '', title }: {flag?: string; language?: string; title: string}) {
      this.flag = flag
      this.language = language
      this.title = title
    }
}

export const guessBrowserLanguage = function (availableLanguages: LocaleInfo[], fallback: string) {
  if (typeof navigator.languages === 'undefined') {
    for (const elem of availableLanguages) {
      if (navigator.language.includes(elem.language)) {
        return elem.language
      }
    }
  } else {
    for (const navLang of navigator.languages) {
      for (const elem of availableLanguages) {
        if (navLang.includes(elem.language)) {
          return elem.language
        }
      }
    }
  }
  return fallback
}

export const defaultLocale = function () {
  return guessBrowserLanguage(LoadedLocalization, '' + i18n.fallbackLocale)
}
