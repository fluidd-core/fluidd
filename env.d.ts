/// <reference types="vite/client" />
/// <reference types="vitest/globals" />
/// <reference types="vuetify" />
/// <reference types="vue-meta" />
/// <reference types="vite-plugin-pwa/client" />

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

interface String {
  toLowerCase<T extends string>(this: T): Lowercase<T>

  toUpperCase<T extends string>(this: T): Uppercase<T>

  startsWith<T extends string, T2 extends string>(this: T, searchString: T2, position?: number): this is `${T2}${string}`

  endWith<T extends string, T2 extends string>(this: T, searchString: T2, position?: number): this is `${string}${T2}`
}
