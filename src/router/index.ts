import Vue from 'vue'
import VueRouter, { NavigationGuardNext, Route, RouteConfig } from 'vue-router'

// Views
import Dashboard from '@/views/Dashboard.vue'
import Jobs from '@/views/Jobs.vue'
import Tune from '@/views/Tune.vue'
import History from '@/views/History.vue'
import Configure from '@/views/Configure.vue'
import Settings from '@/views/Settings.vue'
import AppSettingsNav from '@/components/layout/AppSettingsNav.vue'
import MacroSettings from '@/components/settings/macros/MacroSettings.vue'
import NotFound from '@/views/NotFound.vue'
import Login from '@/views/Login.vue'
import store from '@/store'

Vue.use(VueRouter)

const ifAuthenticated = (to: Route, from: Route, next: NavigationGuardNext<Vue>) => {
  // console.log(store.state.config?.apiUrl)
  if (
    store.getters['auth/getAuthenticated'] ||
    store.state.config?.apiUrl === ''
  ) {
    next()
    return
  }
  console.log('doing this.. ')
  next('/login')
}

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    beforeEnter: ifAuthenticated
  },
  {
    path: '/jobs',
    name: 'Jobs',
    component: Jobs,
    beforeEnter: ifAuthenticated
  },
  {
    path: '/tune',
    name: 'Tune',
    component: Tune,
    beforeEnter: ifAuthenticated
  },
  {
    path: '/history',
    name: 'History',
    component: History,
    beforeEnter: ifAuthenticated
  },
  {
    path: '/configure',
    name: 'Printer Configuration',
    component: Configure,
    beforeEnter: ifAuthenticated
  },
  {
    path: '/settings',
    name: 'Settings',
    beforeEnter: ifAuthenticated,
    components: {
      default: Settings,
      navigation: AppSettingsNav
    },
    children: [
      {
        path: '/settings/macros/:categoryId',
        name: 'Macros',
        components: {
          default: MacroSettings,
          navigation: AppSettingsNav
        }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
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
