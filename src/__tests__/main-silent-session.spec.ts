/**
 * @vitest-environment-options { "url": "https://app.muon3d.com/" }
 */
import { expect, it, vi } from 'vitest'

const boot = vi.hoisted(() => ({
  mount: vi.fn(),
  appInit: vi.fn(async () => ({ apiConfig: { socketUrl: '' } })),
  check: vi.fn(() => new Promise<void>(() => {})),
  initCloud: vi.fn(async () => null),
  navigate: vi.fn(async () => {})
}))
vi.mock('vue', () => ({
  default: class {
    static config = {}
    static directive () {}
    static component () {}
    static use () {}
    $mount = boot.mount
  }
}))
vi.mock('@/init', () => ({ appInit: boot.appInit }))
vi.mock('@/services/muon-cloud/state', () => ({ initCloud: boot.initCloud }))
vi.mock('@/services/muon-cloud/centralLogin', () => ({ shouldTrySilentSignIn: () => true, checkCentralSession: boot.check, startCentralSignIn: boot.navigate }))
vi.mock('@/App.vue', () => ({ default: {} }))
vi.mock('@/router', () => ({ default: { onReady: vi.fn() } }))
vi.mock('@/store', () => ({ default: { commit: vi.fn() } }))
vi.mock('@/plugins/i18n', () => ({ default: {} }))
vi.mock('@/plugins/vuetify', () => ({ default: { framework: { icons: { values: {} } } } }))
vi.mock('@/registerComponentHooks', () => ({}))
vi.mock('@/setupConsola', () => ({}))
vi.mock('@/scss/global.scss', () => ({}))
vi.mock('vue-virtual-scroller/dist/vue-virtual-scroller.css', () => ({}))
vi.mock('vue-virtual-scroller', () => ({ default: {} }))
vi.mock('vue-meta', () => ({ default: {} }))
vi.mock('vue2-touch-events', () => ({ default: {} }))
vi.mock('vue-inline-svg', () => ({ InlineSvgPlugin: {} }))
vi.mock('@/plugins/httpClient', () => ({ HttpClientPlugin: {} }))
vi.mock('@/plugins/filters', () => ({ FiltersPlugin: {} }))
vi.mock('@/plugins/socketClient', () => ({ SocketPlugin: {} }))
vi.mock('@/plugins/colorSet', () => ({ ColorSetPlugin: {} }))
vi.mock('@/plugins/confirm', () => ({ ConfirmPlugin: {} }))
vi.mock('@/directives/blur', () => ({ default: {} }))
vi.mock('@/util/ui-style', () => ({ restoreUiStyle: () => 'glass' }))
vi.mock('@/util/glass-icons', () => ({ applyGlassIcons: vi.fn() }))
vi.mock('@/services/muon-cloud/activate', () => ({ forgetManagedInstance: vi.fn(), activateCloudPrinter: vi.fn(), activateLocalPrinter: vi.fn() }))
vi.mock('@/services/printer-pages', () => ({ preferSavedPrinterFor: vi.fn(), installPrinterPages: vi.fn() }))
vi.mock('@/services/startup/snapshot', () => ({ readSnapshot: vi.fn(), renderCachedState: vi.fn() }))
vi.mock('@/services/startup/idle', () => ({ NO_PREFETCH_PATHS: /setup/, afterFirstPaint: vi.fn(), prefetchRoutes: vi.fn() }))
vi.mock('@/views/Printers.vue', () => ({ default: {} }))
vi.mock('@/views/Overview.vue', () => ({ default: {} }))
vi.mock('@/services/foreign-printers/store', () => ({ listForeign: async () => [] }))
vi.mock('@/services/foreign-printers/registry', () => ({ setForeignRecords: vi.fn() }))

it('initializes and mounts the app while the silent check is unresolved, without navigating', async () => {
  await import('@/main')
  await vi.waitFor(() => expect(boot.mount).toHaveBeenCalledWith('#app'))
  expect(boot.appInit).toHaveBeenCalledOnce()
  expect(boot.check).toHaveBeenCalledOnce()
  expect(boot.navigate).not.toHaveBeenCalled()
  expect(boot.initCloud).toHaveBeenCalledWith(boot.check.mock.results[0].value)
})
