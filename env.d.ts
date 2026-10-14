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
  /** The Muon3D Slicer's embed.html, which Fluidd > Slice frames (views/Slice.vue). */
  readonly VUE_MUON_SLICER_URL?: string
  /** The model service the Library talks to (services/library/api.ts); https://models.muon3d.com when unset. */
  readonly VITE_MODELS_URL?: string
  readonly VERSION: string
  readonly HASH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
