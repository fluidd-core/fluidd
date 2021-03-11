import '@/scss/global.scss'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
// import './registerComponentHooks'
import './plugins/consola'

import Vue from 'vue'
import consola from 'consola'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import VueMeta from 'vue-meta'
import { appInit } from './init'
import { InitConfig } from './store/config/types'
import { FiltersPlugin } from './plugins/filters'
import { SocketPlugin } from './plugins/socketClient'
import { ColorSetPlugin } from './plugins/colorSet'
import { DayJSPlugin } from './plugins/dayjs'
import { AxiosPlugin } from './plugins/axios'
import { plugin } from 'echarts-for-vue'
import VueVirtualScroller from 'vue-virtual-scroller'

// import * as echarts from 'echarts'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  DatasetComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  LegendComponent
} from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'

// import { WorkboxPlugin } from './plugins/workbox'
import vueHeadful from 'vue-headful'

import FluiddBtn from '@/components/inputs/Btn.vue'
import FluiddIcon from '@/components/FluiddIcon.vue'
import BtnCollapse from '@/components/inputs/BtnCollapse.vue'
import CollapsableCard from '@/components/cards/CollapsableCard.vue'
import InlineHelpIcon from '@/components/InlineHelpIcon.vue'
import { Globals } from './globals'

// Configure echarts
echarts.use([
  DatasetComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  LegendComponent,
  LineChart,
  SVGRenderer
])

// Use any Plugins
Vue.use(plugin, { echarts })
Vue.use(AxiosPlugin)
Vue.use(VueVirtualScroller)
Vue.use(DayJSPlugin)
Vue.use(FiltersPlugin)
Vue.use(VueMeta)
Vue.use(ColorSetPlugin, {})
// Vue.use(WorkboxPlugin)

Vue.component('btn-collapse', BtnCollapse)
Vue.component('collapsable-card', CollapsableCard)
Vue.component('vue-headful', vueHeadful)
Vue.component('inline-help', InlineHelpIcon)
Vue.component('fluidd-icon', FluiddIcon)
Vue.component('btn', FluiddBtn)

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

    // Init Vue
    Vue.config.productionTip = false
    new Vue({
      router,
      store,
      vuetify,
      render: (h) => h(App)
    }).$mount('#app')
  })
  .catch((e) => {
    consola.debug('Error attempting to init App:', e)
  })
