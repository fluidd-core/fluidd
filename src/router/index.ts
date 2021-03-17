import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'

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

export default router
