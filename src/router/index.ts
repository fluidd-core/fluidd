import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'

// Views
import Dashboard from '@/views/Dashboard.vue'
import Jobs from '@/views/Jobs.vue'
import Tune from '@/views/Tune.vue'
import Configure from '@/views/Configure.vue'
import Settings from '@/views/Settings.vue'
import AppSettingsNav from '@/components/layout/AppSettingsNav.vue'
import MacroSettings from '@/components/settings/macros/MacroSettings.vue'
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
    path: '/tune',
    name: 'Tune',
    component: Tune
  },
  {
    path: '/configure',
    name: 'Printer Configuration',
    component: Configure
  },
  {
    path: '/settings',
    name: 'Settings',
    components: {
      default: Settings,
      navigation: AppSettingsNav
    },
    children: [
      {
        path: '/settings/macros/:category',
        name: 'Macros',
        components: {
          default: MacroSettings,
          navigation: AppSettingsNav
        }
      }
    ]
  },
  {
    path: '*',
    name: '404',
    component: NotFound
  }
]

const router = new VueRouter({
  base: process.env.BASE_URL,
  routes,
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) return savedPosition
    if (to.hash) {
      return {
        selector: to.hash,
        offset: { x: 0, y: 60 },
        behavior: 'smooth'
      }
    }
    return { x: 0, y: 0 }
  }
})

export default router
