import { mapKeys } from 'lodash-es'
import type { LocaleMessageObject } from 'vue-i18n'

const dynamicImportFixKeys = <T>(entries: Record<string, () => Promise<T>>) => {
  return mapKeys(
    entries,
    (_, key) => key.split('/').pop()?.split('.')[0])
}

export const MonacoLanguageImports = Object.freeze(dynamicImportFixKeys(
  import.meta.glob<object>('@/monaco/language/*.tmLanguage.json', { import: 'default' })
))

export const I18nLocales = Object.freeze(dynamicImportFixKeys(
  import.meta.glob<LocaleMessageObject>('@/locales/*.yaml', { import: 'default' })
))

export const CameraComponents = Object.freeze(dynamicImportFixKeys(
  import.meta.glob<object>('@/components/widgets/camera/services/*Camera.vue')
))
