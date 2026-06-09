// Styles
import '@/scss/global.scss'

// Global Registrations
import './registerComponentHooks'
import './setupConsola'

// Common, 1st party.
import Vue from 'vue'
import i18n from '@/plugins/i18n'
import router from './router'
import store from './store'

// 3rd party.
import vuetify from './plugins/vuetify'
import VueMeta from 'vue-meta'
import VuetifyConfirm from 'vuetify-confirm'
import Vue2TouchEvents from 'vue2-touch-events'
import { InlineSvgPlugin } from 'vue-inline-svg'

// Init.
import { appInit } from './init'

// Import plugins
import { FiltersPlugin } from './plugins/filters'
import { SocketPlugin } from './plugins/socketClient'
import { ColorSetPlugin } from './plugins/colorSet'

// Main App component
import App from './App.vue'

// Register global directives.
import SafeHtml from './directives/safe-html'

// Directives...
Vue.directive('safe-html', SafeHtml)

// v-chart component asynchronously loaded from a split chunk
Vue.component('EChart', () => import('./vue-echarts-chunk'))

// Use any Plugins
Vue.use(FiltersPlugin)
Vue.use(VueMeta)
Vue.use(ColorSetPlugin)
Vue.use(VuetifyConfirm, {
  vuetify
})
Vue.use(InlineSvgPlugin)
Vue.use(Vue2TouchEvents)

Vue.use(SocketPlugin, {
  store
})

Vue.config.productionTip = false

new Vue({
  i18n,
  router,
  store,
  vuetify,
  render: (h) => h(App)
}).$mount('#app')

appInit()
