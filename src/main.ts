import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import { Globals } from './globals'
import { FiltersPlugin } from './plugins/filters'
import { SocketPlugin } from './plugins/socketClient'
import { DayJSPlugin } from './plugins/dayjs'
import { AxiosPlugin } from './plugins/axios'

import '@/scss/global.scss'

// Use any Plugins
Vue.use(AxiosPlugin)
Vue.use(DayJSPlugin)
Vue.use(FiltersPlugin)

// Load API configuration
// If we're in a local development environment,
// then we should load the env variables instead of the
// config.json
const promise = new Promise<ApiConfig>((resolve, reject) => {
  if (process.env.VUE_APP_API && process.env.VUE_APP_SOCKET) {
    resolve({ apiUrl: process.env.VUE_APP_API, socketUrl: process.env.VUE_APP_SOCKET })
  } else {
    fetch('/config.json', { cache: 'no-store' })
      .then(res => res.json())
      .then(resolve)
      .catch(reject)
  }
})

promise
  .then(apiConfig => {
    // Commit the api configuration to our store.
    store.commit('config/onInitApiConfig', apiConfig)
    return fetch(apiConfig.apiUrl + '/server/files/config/' + Globals.SETTINGS_FILENAME, { cache: 'no-store' })
      .then(res => (!res.ok) ? undefined : res.json())
      .then((fileConfig) => {
        // Init the store. This should include any GUI settings we've loaded from moonraker.
        return store.dispatch('init', fileConfig).then(() => {
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
