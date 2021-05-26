// Styles
import '@/scss/global.scss'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

// Global Registrations
import './registerComponentHooks'
import './consola'
// import { WorkboxPlugin } from './plugins/workbox'

// Common
import Vue from 'vue'
import { Globals } from './globals'
import i18n from '@/plugins/i18n'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import consola from 'consola'
import { loadWASM } from 'vscode-oniguruma'
// import { loadWASM } from 'onigasm'

import { appInit } from './init'

import { InitConfig } from './store/config/types'

// Import plugins
import { FiltersPlugin } from './plugins/filters'
import { SocketPlugin } from './plugins/socketClient'
import { ColorSetPlugin } from './plugins/colorSet'
import { DayJSPlugin } from './plugins/dayjs'
import { AxiosPlugin } from './plugins/axios'
import { plugin } from 'echarts-for-vue'
import VueVirtualScroller from 'vue-virtual-scroller'
import VueMeta from 'vue-meta'
import VuetifyConfirm from 'vuetify-confirm'

// Import ECharts
// import * as echarts from 'echarts'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { Grid3DComponent } from 'echarts-gl/components'
import { SurfaceChart } from 'echarts-gl/charts'
import {
  DatasetComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  LegendComponent,
  VisualMapComponent
} from 'echarts/components'

import { SVGRenderer, CanvasRenderer } from 'echarts/renderers'

// Main App component
import App from './App.vue'

// Globally register all components in our common, layout and ui directories.
import '@/components/_globals'

// 3rd party
import vueHeadful from 'vue-headful'

// 3rd party
Vue.component('vue-headful', vueHeadful)

// Use any Plugins

// Configure echarts
echarts.use([
  DatasetComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  LegendComponent,
  LineChart,
  VisualMapComponent,
  SurfaceChart,
  Grid3DComponent,
  SVGRenderer,
  CanvasRenderer
])

Vue.use(plugin, { echarts })
Vue.use(AxiosPlugin)
Vue.use(VueVirtualScroller)
Vue.use(DayJSPlugin)
Vue.use(FiltersPlugin)
Vue.use(VueMeta)
Vue.use(ColorSetPlugin, {})
Vue.use(VuetifyConfirm, {
  vuetify
})
// Vue.use(WorkboxPlugin)

// const loadOnigasm = async (): Promise<void> => {
//   const wasm = await require('vscode-oniguruma/release/onig.wasm')
//   // await response.arrayBuffer()
//   await loadWASM(wasm.default.arrayBuffer)
// }

// loadOnigasm()

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

    if (config.apiConfig.socketUrl && config.apiConnected) {
      Vue.$socket.connect(config.apiConfig.socketUrl)
    }

    // i18n.locale = store.state.config?.uiSettings.general.locale || Globals.DEFAULT_LOCALE

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
