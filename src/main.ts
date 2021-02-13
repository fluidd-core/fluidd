import '@/scss/global.scss'
// import './registerComponentHooks'
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import VueMeta from 'vue-meta'
import { appInit } from './init'
import { Config } from './store/config/types'
import { FiltersPlugin } from './plugins/filters'
import { SocketPlugin } from './plugins/socketClient'
import { ColorSetPlugin } from './plugins/colorSet'
import { DayJSPlugin } from './plugins/dayjs'
import { AxiosPlugin } from './plugins/axios'
import { plugin } from 'echarts-for-vue'

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

import BtnCollapse from '@/components/inputs/BtnCollapse.vue'
import CollapsableCard from '@/components/cards/CollapsableCard.vue'
import InlineHelpIcon from '@/components/inputs/InlineHelpIcon.vue'

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
Vue.use(DayJSPlugin)
Vue.use(FiltersPlugin)
Vue.use(VueMeta)
Vue.use(ColorSetPlugin, {})
// Vue.use(WorkboxPlugin)

Vue.component('btn-collapse', BtnCollapse)
Vue.component('collapsable-card', CollapsableCard)
Vue.component('vue-headful', vueHeadful)
Vue.component('inline-help', InlineHelpIcon)

appInit()
  .then((config: Config) => {
    console.debug('Loaded App Configuration', config)

    // Set vuetify to the correct initial theme.
    // if (store.state.config && store.state.config.fileConfig.general) {
    //   vuetify.framework.theme.dark = store.state.config.fileConfig.general.darkMode
    // }

    // Init the socket plugin
    Vue.use(SocketPlugin, {
      url: config.apiConfig.socketUrl,
      reconnectEnabled: true,
      reconnectInterval: 3000,
      store
    })

    if (config.apiConfig.socketUrl) {
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
    console.debug('Error attempting to init App:', e)
  })
