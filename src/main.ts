// Styles
import '@/scss/global.scss'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

// Global Registrations
import './registerComponentHooks'
import './consola'
// import { WorkboxPlugin } from './plugins/workbox'

// Common, 1st party.
import Vue from 'vue'
import { Globals } from './globals'
import i18n from '@/plugins/i18n'
import router from './router'
import store from './store'
import consola from 'consola'

// 3rd party.
import vuetify from './plugins/vuetify'
import VueVirtualScroller from 'vue-virtual-scroller'
import VueMeta from 'vue-meta'
import VuetifyConfirm from 'vuetify-confirm'
import { InlineSvgPlugin } from 'vue-inline-svg'
import { loadWASM } from 'onigasm'

// Init.
import { appInit } from './init'
import { InitConfig } from './store/config/types'

// Import plugins
import { FiltersPlugin } from './plugins/filters'
import { SocketPlugin } from './plugins/socketClient'
import { ColorSetPlugin } from './plugins/colorSet'
import { DayJSPlugin } from './plugins/dayjs'

// Import ECharts
import ECharts from 'vue-echarts'
import { use as echartsUse } from 'echarts/core'
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

// Register global directives.
import Blur from '@/directives/blur'

// Directives...
Vue.directive('blur', Blur)

// Use any Plugins

// Configure echarts
echartsUse([
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
Vue.component('v-chart', ECharts)

Vue.use(VueVirtualScroller)
Vue.use(DayJSPlugin)
Vue.use(FiltersPlugin)
Vue.use(VueMeta)
Vue.use(ColorSetPlugin, {})
Vue.use(VuetifyConfirm, {
  vuetify
})
Vue.use(InlineSvgPlugin)
// Vue.use(WorkboxPlugin)

const loadOnigasm = async (): Promise<void> => {
  const wasm = await require('onigasm/lib/onigasm.wasm')
  await loadWASM(wasm.default)
}

loadOnigasm()

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
