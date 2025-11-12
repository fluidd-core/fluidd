/// <reference types="vite/client" />
/// <reference types="vitest/globals" />
/// <reference types="vuetify" />
/// <reference types="vue-meta" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="./tsreset" />
/// <reference types="./tshelpers" />

declare module '*.yaml' {
  const data: unknown
  export default data
}

declare module '@/locales/*.yaml' {
  import type { LocaleMessageObject } from 'vue-i18n'

  const data: LocaleMessageObject
  export default data
}

interface ImportMetaEnv {
  readonly VUE_APP_I18N_LOCALE?: string
  readonly VUE_APP_I18N_FALLBACK_LOCALE?: string
  readonly VERSION: string
  readonly HASH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
