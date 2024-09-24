import Vue from 'vue'
import VueRouter, { type RouteConfig } from 'vue-router'

// Views
import Dashboard from '@/views/Dashboard.vue'
import Console from '@/views/Console.vue'
import GcodePreview from '@/views/GcodePreview.vue'
import Jobs from '@/views/Jobs.vue'
import Tune from '@/views/Tune.vue'
import Diagnostics from '@/views/Diagnostics.vue'
import History from '@/views/History.vue'
import Timelapse from '@/views/Timelapse.vue'
import Configure from '@/views/Configure.vue'
import System from '@/views/System.vue'
import Settings from '@/views/Settings.vue'
import AppSettingsNav from '@/components/layout/AppSettingsNav.vue'
import MacroCategorySettings from '@/components/settings/macros/MacroCategorySettings.vue'
import FullscreenCamera from '@/views/FullscreenCamera.vue'
import NotFound from '@/views/NotFound.vue'
import Login from '@/views/Login.vue'
import Icons from '@/views/Icons.vue'

Vue.use(VueRouter)

const isAuthenticated = () => (
  router.app.$store.getters['auth/getAuthenticated'] ||
  !router.app.$store.state.socket.apiConnected
)

const defaultRouteConfig: Partial<RouteConfig> = {
  beforeEnter: (to, from, next) => {
    if (isAuthenticated()) {
      next()
    } else {
      next('/login')
    }
  },
  meta: {
    fileDropRoot: 'gcodes'
  }
}

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    ...defaultRouteConfig
  },
  {
    path: '/console',
    name: 'Console',
    component: Console,
    ...defaultRouteConfig
  },
  {
    path: '/jobs',
    name: 'Jobs',
    component: Jobs,
    ...defaultRouteConfig
  },
  {
    path: '/tune',
    name: 'Tune',
    component: Tune,
    ...defaultRouteConfig
  },
  {
    path: '/diagnostics',
    name: 'Diagnostics',
    component: Diagnostics,
    ...defaultRouteConfig
  },
  {
    path: '/timelapse',
    name: 'Timelapse',
    component: Timelapse,
    ...defaultRouteConfig,
    meta: {
      fileDropRoot: 'timelapse'
    }
  },
  {
    path: '/history',
    name: 'History',
    component: History,
    ...defaultRouteConfig
  },
  {
    path: '/system',
    name: 'System',
    component: System,
    ...defaultRouteConfig
  },
  {
    path: '/configure',
    name: 'Configuration',
    component: Configure,
    ...defaultRouteConfig,
    meta: {}
  },
  {
    path: '/settings',
    name: 'Settings',
    ...defaultRouteConfig,
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
          default: MacroCategorySettings,
          navigation: AppSettingsNav
        }
      }
    ]
  },
  {
    path: '/camera/:cameraId',
    name: 'Camera',
    component: FullscreenCamera,
    ...defaultRouteConfig
  },
  {
    path: '/preview',
    name: 'Gcode Preview',
    component: GcodePreview,
    ...defaultRouteConfig
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    beforeEnter: (to, from, next) => {
      if (isAuthenticated()) {
        next('/')
      } else {
        next()
      }
    },
    meta: {
      fillHeight: true
    }
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
  router.app?.$store.commit('config/setContainerColumnCount', 2)
  next()
})

declare module 'vue-router' {
  interface RouteMeta {
    fillHeight?: boolean
    hasSubNavigation?: boolean
    fileDropRoot?: string
  }
}

export default router
