// Styles
import '@/scss/global.scss'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

// Global Registrations
import './registerComponentHooks'
import './setupConsola'

// Common, 1st party.
import Vue from 'vue'
import { Globals } from './globals'
import i18n from '@/plugins/i18n'
import router from './router'
import store from './store'
import { consola } from 'consola'

// 3rd party.
import vuetify from './plugins/vuetify'
import VueVirtualScroller from 'vue-virtual-scroller'
import VueMeta from 'vue-meta'
import Vue2TouchEvents from 'vue2-touch-events'
import { InlineSvgPlugin } from 'vue-inline-svg'

// Init.
import { appInit } from './init'
import { initCloud } from './services/muon-cloud/state'
import { shouldTrySilentSignIn, startCentralSignIn } from './services/muon-cloud/centralLogin'
import { activateCloudPrinter, activateLocalPrinter, forgetManagedInstance } from './services/muon-cloud/activate'
import {
  activeSlug,
  installPrinterPages,
  isActiveSlug,
  isPrintersOwnPage,
  learnActiveIdentity,
  openPrinterAt,
  preferSavedPrinterFor
} from './services/printer-pages'
import type { InitConfig } from './store/config/types'

// Import plugins
import { HttpClientPlugin } from './plugins/httpClient'
import { FiltersPlugin } from './plugins/filters'
import { SocketPlugin } from './plugins/socketClient'
import { ColorSetPlugin } from './plugins/colorSet'
import { ConfirmPlugin } from './plugins/confirm'

// Main App component
import App from './App.vue'
import { LOADER_ID, setLoaderProgress, startupState } from './services/startup/loader'
import { readSnapshot, renderCachedState } from './services/startup/snapshot'
import { afterFirstPaint, NO_PREFETCH_PATHS, prefetchRoutes } from './services/startup/idle'

// Register global directives.
import Blur from '@/directives/blur'
import { restoreUiStyle } from '@/util/ui-style'
import { applyGlassIcons } from '@/util/glass-icons'

// The entry is evaluated: the loader's next mark (KAN-525).
setLoaderProgress(0.8)

// What the printers last showed goes up while the socket connects; the
// loader's wordmark stays when there is none (/setup, /sign-in, first run).
const cachedSlot = document.querySelector<HTMLElement>(`#${LOADER_ID} .muon-loader__cached`)
startupState.cachedShown = !!cachedSlot && renderCachedState(cachedSlot, readSnapshot(), window.location.pathname)
if (startupState.cachedShown) document.getElementById(LOADER_ID)?.classList.add('muon-loader--cached')

// The first frame's two pages' chunks, fetched in parallel with appInit;
// the warm load would otherwise wait for the router to resolve the route.
// Not on a load that leaves at once for the console's silent sign-in: there
// they only queued ahead of /authorize on HTTP/1.1 (14 Oct 2026).
const prefetchFirstPages = () => {
  if (NO_PREFETCH_PATHS.test(window.location.pathname)) return
  import('@/views/Printers.vue').catch(() => {})
  import('@/views/Overview.vue').catch(() => {})
}

// Directives...
Vue.directive('blur', Blur)

// v-chart component asynchronously loaded from a split chunk
Vue.component('EChart', () => import('./vue-echarts-chunk'))

// Use any Plugins
Vue.use(VueVirtualScroller)
Vue.use(FiltersPlugin)
Vue.use(VueMeta)
Vue.use(ColorSetPlugin, {})
Vue.use(ConfirmPlugin, {
  vuetify,
  i18n
})
Vue.use(InlineSvgPlugin)
Vue.use(Vue2TouchEvents)

Vue.use(HttpClientPlugin, {
  store
})

// import { AuxClientPlugin } from '@/plugins/auxClient'
// Vue.use(AuxClientPlugin, { store })

// A cloud printer is selected through a placeholder API address that Fluidd
// records as an instance. It must never be the instance Fluidd starts on.
forgetManagedInstance()

// An address that names a saved printer (/boxwood-367a/jobs) starts on it.
preferSavedPrinterFor(window.location.pathname, Globals.LOCAL_INSTANCES_STORAGE_KEY)

const restoredUiStyle = restoreUiStyle()
store.commit('config/setRestoredUiStyle', restoredUiStyle)
applyGlassIcons(vuetify.framework.icons.values as unknown as Record<string, unknown>, restoredUiStyle === 'glass')

const mountApp = () => {
  Vue.config.productionTip = false
  new Vue({
    i18n,
    router,
    store,
    vuetify,
    render: (h) => h(App)
  }).$mount('#app')

  // The printer pages' chunks fetch ahead once the first frame is drawn.
  router.onReady(() => afterFirstPaint(() => prefetchRoutes()))
}

// First-run setup, and the console's sign-in page (WEB-12), mount at once and
// never run appInit or initCloud (05 §2): neither needs a printer, and the
// sign-in page must not restore or start a Muon3D session of its own. appInit holds $mount for a probe of up to 5 s and loads
// the Moonraker database, and a failure there left the page blank for good.
// initCloud, with a Muon3D session stored for this origin, calls the console
// and loads the Iroh client: requests to the internet from a page that may
// reach only the printer, over mobile data on the hotspot (05 §7). The page
// runs its own client instead. The socket plugin is installed, unconnected,
// because the shell still refers to Vue.$socket.
// The router has already turned an old /#/setup address into /setup.
if (/^\/(?:setup|sign-in)(?:\/|$)/.test(window.location.pathname)) {
  Vue.use(SocketPlugin, { url: '', store })
  mountApp()
} else if (shouldTrySilentSignIn()) {
  // Served by the console with no session (WEB-12): ask /authorize with
  // prompt=none before loading anything. Signed in there, this comes straight
  // back with a code; if not, it comes back signed out and shows "Sign in".
  startCentralSignIn({ silent: true }).catch((e) => consola.debug('Could not start the central sign-in', e))
} else {
  prefetchFirstPages()
  appInit()
    .then(async (config: InitConfig) => {
      consola.debug('Loaded App Configuration', config)
      try {
        if (import.meta.env.DEV && new URLSearchParams(location.search).get('foreignDemo') === '1') {
          const { loadForeign } = await import('./services/foreign-printers/live')
          await loadForeign()
        } else {
          const [{ listForeign }, { setForeignRecords }] = await Promise.all([
            import('./services/foreign-printers/store'),
            import('./services/foreign-printers/registry')
          ])
          setForeignRecords(await listForeign())
        }
      } catch (e) {
        consola.debug('Could not load browser-only printers', e)
      }

      // Init the socket plugin
      Vue.use(SocketPlugin, {
        url: config.apiConfig.socketUrl,
        reconnectEnabled: true,
        reconnectInterval: Globals.SOCKET_RETRY_DELAY,
        store
      })

      if (config.apiConfig.socketUrl && config.apiConnected && config.apiAuthenticated) {
        Vue.$socket.connect(config.apiConfig.socketUrl)
      }

      // The address names the printer Fluidd shows (/boxwood-367a/jobs).
      installPrinterPages(router, { activateLocalPrinter, activateCloudPrinter })

      mountApp()

      // Restore the Muon3D account, then open the printer the address names
      // if it is an account one. A printer's own address opens its page.
      //
      // Wait for the first navigation: a lazy route is not the current route
      // until its chunk has loaded, and its meta decides here.
      initCloud().then((returnTo) => router.onReady(async () => {
        // Back from the console's /authorize: go on where the sign-in started,
        // before anything below reads the current route.
        if (returnTo && returnTo !== '/') await router.replace(returnTo).catch(() => {})

        // Setup reached by navigating inside the app keeps its place too:
        // reopening a cloud printer runs appInit, which sends every route but
        // the dashboard back to it.
        if (router.currentRoute.name === 'setup') return

        const wanted = router.currentRoute.params.printer
        if (wanted) {
          // The account's printers are known now: one of them may be it.
          if (!isActiveSlug(wanted)) openPrinterAt(wanted).catch((e) => consola.debug('Could not open the printer', e))
        } else if (router.currentRoute.name === 'Printers' && isPrintersOwnPage(store.state.config.apiUrl)) {
          // U2: a printer's own address opens that printer, with Printers a
          // click away. The shared name (muon3d.local) and the console show
          // every printer.
          await learnActiveIdentity()
          const slug = activeSlug()
          if (slug && router.currentRoute.name === 'Printers') router.replace(`/${slug}`).catch(() => {})
        }
      }))
    })
    .catch((e) => {
      consola.debug('Error attempting to init App:', e)
    })
}
