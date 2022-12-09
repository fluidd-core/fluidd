/// <reference types="vite/client" />
/// <reference types="vitest/globals" />
/// <reference types="vuetify" />
/// <reference types="vue-meta" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.yaml' {
  const data: any
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
