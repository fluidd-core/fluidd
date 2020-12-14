import Vue from 'vue'
import store from '@/store'
import VueRouter, { RouteConfig } from 'vue-router'
import { Globals } from '@/globals'

// Views
import Dashboard from '@/views/Dashboard.vue'
import Jobs from '@/views/Jobs.vue'
import Configuration from '@/views/Configuration.vue'
import Settings from '@/views/Settings.vue'
import NotFound from '@/views/NotFound.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/jobs',
    name: 'Jobs',
    component: Jobs
  },
  {
    path: '/settings',
    name: 'App Settings',
    component: Settings
  },
  {
    path: '/configuration',
    name: 'Printer Configuration',
    component: Configuration
  },
  {
    path: '*',
    name: '404',
    component: NotFound
  }
]

const router = new VueRouter({
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to, from, next) => {
  // If klippy is disconnected, users should not be able to
  // go to the jobs page, because virtual_sdcard won't be working.
  if (
    store.getters['socket/getKlippyConnected'] !== true &&
    to.name === 'Jobs'
  ) {
    next(Globals.KLIPPY_DISCONNECTED_REDIRECT)
  } else {
    next()
  }
})

export default router
