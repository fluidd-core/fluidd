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
import { cloudState, initCloud } from './services/muon-cloud/state'
import { shouldTrySilentSignIn, startCentralSignIn } from './services/muon-cloud/centralLogin'
import { activateCloudPrinter, forgetManagedInstance } from './services/muon-cloud/activate'
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

      mountApp()

      // Restore the Muon3D account, and the cloud printer it was last showing.
      // With no printer to show at all, start on the welcome page, which finds
      // printers on this network and offers the account.
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

        const active = cloudState.activePrinterId
        if (active && cloudState.account && cloudState.printers.some(p => p.id === active)) {
          activateCloudPrinter(active).catch((e) => consola.debug('Could not reopen the cloud printer', e))
        } else if (!store.state.config.apiUrl && !router.currentRoute.meta?.printerIndependent) {
          router.replace('/welcome').catch(() => {})
        }
      }))
    })
    .catch((e) => {
      consola.debug('Error attempting to init App:', e)
    })
}
