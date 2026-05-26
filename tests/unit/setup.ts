import { vi } from 'vitest'
import type { VueConstructor } from 'vue'

vi.mock('vue', async () => {
  const Vue = await vi.importActual<VueConstructor>('vue')

  Vue.config.productionTip = false
  Vue.config.devtools = false

  return Vue
})

// jsdom is missing a few browser globals Monaco's StandaloneThemeService
// touches (CSS.escape, window.matchMedia). Polyfilled here so any spec that
// loads monaco-editor gets them without per-spec setup.
const cssGlobal = (globalThis as { CSS?: { escape?: (v: string) => string } }).CSS
if (!cssGlobal) {
  ;(globalThis as { CSS: { escape: (v: string) => string } }).CSS = { escape: (v) => v }
} else if (!cssGlobal.escape) {
  cssGlobal.escape = (v) => v
}

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })
}
