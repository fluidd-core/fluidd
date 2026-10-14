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
import VuetifyConfirm from 'vuetify-confirm'
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

// Main App component
import App from './App.vue'

// Register global directives.
import Blur from '@/directives/blur'
import { restoreUiStyle } from '@/util/ui-style'
import { applyGlassIcons } from '@/util/glass-icons'

// Directives...
Vue.directive('blur', Blur)

// v-chart component asynchronously loaded from a split chunk
Vue.component('EChart', () => import('./vue-echarts-chunk'))

// Use any Plugins
Vue.use(VueVirtualScroller)
Vue.use(FiltersPlugin)
Vue.use(VueMeta)
Vue.use(ColorSetPlugin, {})
Vue.use(VuetifyConfirm, {
  vuetify
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
  appInit()
    .then((config: InitConfig) => {
      consola.debug('Loaded App Configuration', config)

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
