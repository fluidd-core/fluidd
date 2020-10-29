import '@/scss/global.scss'
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import VueMeta from 'vue-meta'
import { Globals } from './globals'
import { FiltersPlugin } from './plugins/filters'
import { SocketPlugin } from './plugins/socketClient'
import { DayJSPlugin } from './plugins/dayjs'
import { AxiosPlugin } from './plugins/axios'

import Btn from '@/components/inputs/Btn.vue'
import CollapsableCard from '@/components/cards/CollapsableCard.vue'

Vue.component('btn', Btn)
Vue.component('collapsable-card', CollapsableCard)

// Use any Plugins
Vue.use(AxiosPlugin)
Vue.use(DayJSPlugin)
Vue.use(FiltersPlugin)
Vue.use(VueMeta)

// Load API configuration
// If we're in a local development environment,
// then we should load the env variables instead of the
// config.json. config.json can also be used to override
// the default host for API and Websockets, if required.
const promise = new Promise<ApiConfig>((resolve, reject) => {
  if (process.env.VUE_APP_API && process.env.VUE_APP_SOCKET) {
    console.debug('API Config from ENV', process.env)
    resolve({ apiUrl: process.env.VUE_APP_API, socketUrl: process.env.VUE_APP_SOCKET })
  } else {
    fetch('/config.json', { cache: 'no-store' })
      .then(res => (res.ok) ? res.json() : undefined)
      .then(res => {
        if (
          res &&
          res.apiUrl &&
          res.socketUrl &&
          res.apiUrl !== '' &&
          res.socketUrl !== ''
        ) {
          console.debug('API Config from JSON', res)
          return res
        } else {
          const wsProtocol = document.location.protocol === 'https:' ? 'wss://' : 'ws://'
          const r = {
            apiUrl: '//' + window.location.host,
            socketUrl: wsProtocol + window.location.host + '/websocket'
          }
          console.debug('API Config from window.location', r)
          return r
        }
      })
      .then(resolve)
      .catch(reject)
  }
})

promise
  .then(apiConfig => {
    // Commit the api configuration to our store.
    store.commit('config/onInitApiConfig', apiConfig)
    return fetch(apiConfig.apiUrl + '/server/files/config/' + Globals.SETTINGS_FILENAME, { cache: 'no-store' })
      .then(res => (res.ok) ? res.json() : undefined)
      .then((fileConfig) => {
        // Init the store. This should include any GUI settings we've loaded from moonraker.
        return store.dispatch('init', fileConfig).then(() => {
          // Set vuetify to the correct initial theme.
          if (store.state.config && store.state.config.fileConfig.general) {
            vuetify.framework.theme.dark = store.state.config.fileConfig.general.darkMode
          }

          // Init the socket plugin
          Vue.use(SocketPlugin, {
            url: apiConfig.socketUrl,
            reconnectEnabled: true,
            reconnectInterval: 3000,
            store
          })

          // Init Vue
          Vue.config.productionTip = false
          new Vue({
            router,
            store,
            vuetify,
            render: (h) => h(App)
          }).$mount('#app')
        })
      })
  }).catch((e) => {
    console.error(e)
  })

export interface ApiConfig {
  apiUrl: string;
  socketUrl: string;
}
