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
import { InlineSvgPlugin } from 'vue-inline-svg'

// Init.
import { appInit } from './init'
import { InitConfig } from './store/config/types'

// Import plugins
import { HttpClientPlugin } from './plugins/httpClient'
import { FiltersPlugin } from './plugins/filters'
import { SocketPlugin } from './plugins/socketClient'
import { ColorSetPlugin } from './plugins/colorSet'

// Main App component
import App from './App.vue'

// Register global directives.
import Blur from '@/directives/blur'
import SortableDataTable from '@/directives/sortableDataTable'

// Directives...
Vue.directive('blur', Blur)
Vue.directive('sortableDataTable', SortableDataTable)

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

Vue.use(HttpClientPlugin, {
  store
})

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

    // Init Vue
    Vue.config.productionTip = false
    new Vue({
      i18n,
      router,
      store,
      vuetify,
      render: (h) => h(App)
    }).$mount('#app')
  })
  .catch((e) => {
    consola.debug('Error attempting to init App:', e)
  })
