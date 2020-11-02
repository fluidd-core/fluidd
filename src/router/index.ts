import Vue from 'vue'
// import store from '@/store'
import VueRouter, { RouteConfig } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Jobs from '../views/Jobs.vue'
import Configuration from '../views/Configuration.vue'
import Settings from '../views/Settings.vue'
import NotFound from '../views/NotFound.vue'

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
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// router.beforeEach((to, from, next) => {
//   // If klippy is disconnected, users should not be able to
//   // go to the dashboard.
//   if (
//     store.getters['socket/getKlippyState'] !== true &&
//     to.name === 'Dashboard'
//   ) {
//     next({ name: 'Printer Configuration' })
//   } else {
//     next()
//   }
// })

export default router
