import Vue from 'vue'
import VueRouter, { NavigationGuardNext, Route, RouteConfig } from 'vue-router'

// Views
import Dashboard from '@/views/Dashboard.vue'
import Console from '@/views/Console.vue'
import Jobs from '@/views/Jobs.vue'
import Tune from '@/views/Tune.vue'
import Diagnostics from '@/views/Diagnostics.vue'
import History from '@/views/History.vue'
import Timelapse from '@/views/Timelapse.vue'
import Configure from '@/views/Configure.vue'
import System from '@/views/System.vue'
import Settings from '@/views/Settings.vue'
import AppSettingsNav from '@/components/layout/AppSettingsNav.vue'
import MacroSettings from '@/components/settings/macros/MacroSettings.vue'
import FullscreenCamera from '@/views/FullscreenCamera.vue'
import NotFound from '@/views/NotFound.vue'
import Login from '@/views/Login.vue'
import Icons from '@/views/Icons.vue'

Vue.use(VueRouter)

const ifAuthenticated = (to: Route, from: Route, next: NavigationGuardNext<Vue>) => {
  if (
    router.app.$store.getters['auth/getAuthenticated'] ||
    !router.app.$store.state.socket.apiConnected
  ) {
    next()
    return
  }
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
    path: '/console',
    name: 'Console',
    component: Console,
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
    path: '/diagnostics',
    name: 'Diagnostics',
    component: Diagnostics,
    beforeEnter: ifAuthenticated
  },
  {
    path: '/timelapse',
    name: 'Timelapse',
    component: Timelapse,
    beforeEnter: ifAuthenticated
  },
  {
    path: '/history',
    name: 'History',
    component: History,
    beforeEnter: ifAuthenticated
  },
  {
    path: '/system',
    name: 'System',
    component: System,
    beforeEnter: ifAuthenticated
  },
  {
    path: '/configure',
    name: 'Configuration',
    component: Configure,
    beforeEnter: ifAuthenticated
  },
  {
    path: '/settings',
    name: 'Settings',
    beforeEnter: ifAuthenticated,
    meta: {
      hasSubNavigation: true
    },
    components: {
      default: Settings,
      navigation: AppSettingsNav
    },
    children: [
      {
        path: '/settings/macros/:categoryId',
        name: 'Macros',
        meta: {
          hasSubNavigation: true
        },
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
    component: Login,
    meta: {
      fillHeight: true
    }
  },
  {
    path: '/camera/:cameraId',
    name: 'Camera',
    component: FullscreenCamera
  },
  {
    path: '/icons',
    name: 'Icons',
    component: Icons
  },
  {
    path: '*',
    name: '404',
    component: NotFound
  }
]

const router = new VueRouter({
  base: import.meta.env.BASE_URL,
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

router.beforeEach((to, from, next) => {
  router.app.$store.commit('config/setContainerColumnCount', 2)
  next()
})

export default router
